import { describe, it, expect, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
});

describe('GET /api/laporan/export/excel', () => {
  it('returns 400 when there is no ranking yet', async () => {
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it('exports every ranked row, not just a single page of results', async () => {
    const db = getDb();
    const now = new Date().toISOString();
    const rowCount = 60;
    for (let i = 1; i <= rowCount; i += 1) {
      const info = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (?, ?, ?)').run(`A${i}`, String(i), `Mhs ${i}`);
      const id = Number(info.lastInsertRowid);
      db.prepare(
        `INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at)
         VALUES (?, 0.1, 0.05, 0.05, ?, ?)`
      ).run(id, i, now);
    }

    const res = await GET();
    expect(res.status).toBe(200);
    const buffer = Buffer.from(await res.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet('Ranking PROMETHEE')!;
    expect(sheet.rowCount).toBe(rowCount + 1);
  });
});
