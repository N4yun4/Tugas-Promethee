import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import ExcelJS from 'exceljs';
import { resetDbSingleton, getDb } from '@/lib/db';
import { runSeed } from '@/lib/seedCore';
import { POST } from './route';

function seedSmallDataset() {
  const db = getDb();
  db.prepare(
    `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES
     ('C1','Kehadiran','benefit',0.5,'usual',NULL),
     ('C2','IPK','benefit',0.5,'usual',NULL)`
  ).run();
  const kriteria = db.prepare('SELECT id, kode FROM kriteria').all() as { id: number; kode: string }[];
  const byKode = new Map(kriteria.map((k) => [k.kode, k.id]));

  const students = [
    { altCode: 'A1', nim: '1', nama: 'Satu', c1: 100, c2: 4 },
    { altCode: 'A2', nim: '2', nama: 'Dua', c1: 50, c2: 2 },
  ];
  const ids: { id: number }[] = [];
  for (const s of students) {
    const info = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (?, ?, ?)').run(s.altCode, s.nim, s.nama);
    const id = Number(info.lastInsertRowid);
    ids.push({ id });
    db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)').run(id, byKode.get('C1'), s.c1);
    db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)').run(id, byKode.get('C2'), s.c2);
  }
  return ids;
}

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
});

describe('POST /api/proses', () => {
  it('computes and stores ranking, with the stronger alternative ranked first', async () => {
    const students = seedSmallDataset();
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alternatifCount).toBe(2);

    const db = getDb();
    const rows = db.prepare('SELECT * FROM hasil_ranking ORDER BY ranking').all() as any[];
    expect(rows).toHaveLength(2);
    expect(rows[0].mahasiswa_id).toBe(students[0].id);
    expect(rows[0].ranking).toBe(1);
  });

  it('replaces previous results instead of accumulating on a second run', async () => {
    seedSmallDataset();
    await POST();
    await POST();

    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM hasil_ranking').get() as { c: number };
    expect(count.c).toBe(2);
  });

  it('returns 400 naming the student (not a bare internal id) when nilai is incomplete', async () => {
    const db = getDb();
    db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C1','Kehadiran','benefit',1,'usual',NULL)`).run();
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661099','Mahasiswa Baru')`).run();

    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('A1');
    expect(body.error).toContain('236661099');
    expect(body.error).toContain('Mahasiswa Baru');
  });

  it('reproduces Ranking_PROMETHEE.xlsx end-to-end through seed and the real DB (not just the bare engine)', async () => {
    const db = getDb();
    await runSeed(db, path.join(process.cwd(), 'dataset_promethee.xlsx'));

    const res = await POST();
    expect(res.status).toBe(200);

    const stored = db
      .prepare(
        `SELECT h.ranking as ranking, m.alt_code as altCode, h.leaving_flow as leavingFlow,
                h.entering_flow as enteringFlow, h.net_flow as netFlow
         FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id`
      )
      .all() as { ranking: number; altCode: string; leavingFlow: number; enteringFlow: number; netFlow: number }[];
    const byAltCode = new Map(stored.map((r) => [r.altCode, r]));
    expect(stored).toHaveLength(254);

    const acuanWorkbook = new ExcelJS.Workbook();
    await acuanWorkbook.xlsx.readFile(path.join(process.cwd(), 'Ranking_PROMETHEE.xlsx'));
    const sheet = acuanWorkbook.getWorksheet('Sheet1')!;

    let comparedRows = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const acuanRanking = Number(row.getCell(1).value);
      const altCode = String(row.getCell(2).value);
      const acuanNetFlow = Number(row.getCell(5).value);

      const actual = byAltCode.get(altCode);
      expect(actual, `missing result for ${altCode}`).toBeDefined();
      expect(actual!.ranking).toBe(acuanRanking);
      expect(Math.abs(actual!.netFlow - acuanNetFlow)).toBeLessThan(1e-6);
      comparedRows += 1;
    });
    expect(comparedRows).toBe(254);
  });
});
