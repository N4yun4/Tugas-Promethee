import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET, PUT, DELETE } from './route';

let mahasiswaId: number;

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(
    `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
     VALUES ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
  ).run();
  const kriteriaId = (db.prepare(`SELECT id FROM kriteria WHERE kode='C1'`).get() as { id: number }).id;

  const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  mahasiswaId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, 99.13)').run(mahasiswaId, kriteriaId);
});

describe('GET /api/mahasiswa/[id]', () => {
  it('returns 404 for an unknown id', async () => {
    const res = await GET(new Request('http://localhost/api/mahasiswa/999'), { params: { id: '999' } });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/mahasiswa/[id]', () => {
  it('updates nama and nim', async () => {
    const res = await PUT(
      new Request('http://localhost/api/mahasiswa/1', {
        method: 'PUT',
        body: JSON.stringify({ nim: '236661001', nama: 'Irvan Topa Updated' }),
      }),
      { params: { id: String(mahasiswaId) } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nama).toBe('Irvan Topa Updated');
  });
});

describe('DELETE /api/mahasiswa/[id]', () => {
  it('removes the mahasiswa and cascades to penilaian', async () => {
    const res = await DELETE(new Request('http://localhost/api/mahasiswa/1', { method: 'DELETE' }), {
      params: { id: String(mahasiswaId) },
    });
    expect(res.status).toBe(200);

    const db = getDb();
    const remaining = db.prepare('SELECT COUNT(*) as c FROM penilaian WHERE mahasiswa_id = ?').get(mahasiswaId) as {
      c: number;
    };
    expect(remaining.c).toBe(0);
  });
});
