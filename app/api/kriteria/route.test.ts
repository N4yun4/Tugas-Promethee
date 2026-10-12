import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(
    `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES
     ('C2','Jumlah Alfa','cost',0.333333,'usual',NULL),
     ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
  ).run();
});

describe('GET /api/kriteria', () => {
  it('returns kriteria ordered by kode', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].kode).toBe('C1');
    expect(body[1].kode).toBe('C2');
    expect(body[0].parameterP).toBe(20.205628);
  });
});
