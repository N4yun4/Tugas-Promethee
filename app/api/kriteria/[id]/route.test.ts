import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { PUT } from './route';

let kriteriaId: number;

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
       VALUES ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
    )
    .run();
  kriteriaId = Number(info.lastInsertRowid);
});

describe('PUT /api/kriteria/[id]', () => {
  it('updates bobot', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'benefit', bobot: 0.2, preferenceFunction: 'linear', parameterP: 20 }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bobot).toBe(0.2);
  });

  it('rejects linear preference function without parameterP', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'benefit', bobot: 0.2, preferenceFunction: 'linear', parameterP: null }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('rejects a non-positive parameterP for a linear kriteria', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'benefit', bobot: 0.2, preferenceFunction: 'linear', parameterP: -5 }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('rejects a zero parameterP for a linear kriteria', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'benefit', bobot: 0.2, preferenceFunction: 'linear', parameterP: 0 }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('rejects an invalid jenis value', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'invalid', bobot: 0.2, preferenceFunction: 'usual', parameterP: null }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(400);
  });
});
