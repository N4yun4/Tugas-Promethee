import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { PUT } from './route';

let mahasiswaId: number;

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C1','Kehadiran','benefit',1,'usual',NULL)`).run();
  const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  mahasiswaId = Number(info.lastInsertRowid);
});

describe('PUT /api/penilaian/[mahasiswaId]', () => {
  it('upserts nilai for the given kriteria', async () => {
    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C1: 95 } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nilai.C1).toBe(95);
  });

  it('rejects an unknown kriteria kode', async () => {
    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C9: 1 } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('rejects a blank string nilai instead of silently storing it as 0', async () => {
    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C1: '' } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('rejects a null nilai instead of silently storing it as 0', async () => {
    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C1: null } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('writes nothing when one kode in the request is invalid (all-or-nothing)', async () => {
    const db = getDb();
    db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C2','Alfa','cost',1,'usual',NULL)`).run();

    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C1: 5, C9: 1 } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(400);

    const stored = db.prepare('SELECT COUNT(*) as c FROM penilaian WHERE mahasiswa_id = ?').get(mahasiswaId) as { c: number };
    expect(stored.c).toBe(0);
  });
});
