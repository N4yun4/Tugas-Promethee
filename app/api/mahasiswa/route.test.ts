import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET, POST } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','236661002','Jaslianor Wijaya Aglin')`).run();
});

describe('GET /api/mahasiswa', () => {
  it('returns all mahasiswa ordered by alt_code number', async () => {
    const res = await GET(new Request('http://localhost/api/mahasiswa'));
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].altCode).toBe('A1');
    expect(body[1].nim).toBe('236661002');
  });

  it('filters by search term across nim and nama', async () => {
    const res = await GET(new Request('http://localhost/api/mahasiswa?search=Jaslianor'));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].nama).toBe('Jaslianor Wijaya Aglin');
  });
});

describe('POST /api/mahasiswa', () => {
  it('creates a new mahasiswa with the next available alt_code', async () => {
    const res = await POST(
      new Request('http://localhost/api/mahasiswa', {
        method: 'POST',
        body: JSON.stringify({ nim: '236661099', nama: 'Mahasiswa Baru' }),
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.altCode).toBe('A3');
  });

  it('rejects a duplicate NIM', async () => {
    const res = await POST(
      new Request('http://localhost/api/mahasiswa', {
        method: 'POST',
        body: JSON.stringify({ nim: '236661001', nama: 'Duplikat' }),
      })
    );
    expect(res.status).toBe(409);
  });
});
