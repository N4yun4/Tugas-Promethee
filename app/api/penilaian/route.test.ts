import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C1','Kehadiran','benefit',1,'usual',NULL)`).run();
  const kriteriaId = (db.prepare(`SELECT id FROM kriteria WHERE kode='C1'`).get() as { id: number }).id;
  const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, 99.13)').run(Number(info.lastInsertRowid), kriteriaId);
});

describe('GET /api/penilaian', () => {
  it('returns one pivoted row per mahasiswa with nilai keyed by kriteria kode', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].nilai.C1).toBe(99.13);
  });
});
