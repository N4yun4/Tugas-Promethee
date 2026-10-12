import { describe, it, expect, beforeEach } from 'vitest';
import type { Db } from './db';
import { createDb } from './db';

let db: Db;

beforeEach(() => {
  db = createDb(':memory:');
});

describe('schema and cascade delete', () => {
  it('cascades delete from mahasiswa to penilaian and hasil_ranking', () => {
    db.prepare(
      `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
       VALUES ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
    ).run();
    const kriteria = db.prepare(`SELECT id FROM kriteria WHERE kode='C1'`).get() as { id: number };

    const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
    const mahasiswaId = Number(info.lastInsertRowid);

    db.prepare(`INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, 99.13)`).run(mahasiswaId, kriteria.id);
    db.prepare(
      `INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at)
       VALUES (?, 0.1, 0.05, 0.05, 1, '2026-01-01T00:00:00.000Z')`
    ).run(mahasiswaId);

    db.prepare(`DELETE FROM mahasiswa WHERE id = ?`).run(mahasiswaId);

    const penilaianCount = db.prepare(`SELECT COUNT(*) as c FROM penilaian WHERE mahasiswa_id = ?`).get(mahasiswaId) as { c: number };
    const rankingCount = db.prepare(`SELECT COUNT(*) as c FROM hasil_ranking WHERE mahasiswa_id = ?`).get(mahasiswaId) as { c: number };

    expect(penilaianCount.c).toBe(0);
    expect(rankingCount.c).toBe(0);
  });

  it('rejects a duplicate NIM', () => {
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
    expect(() =>
      db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','236661001','Duplikat')`).run()
    ).toThrow();
  });
});
