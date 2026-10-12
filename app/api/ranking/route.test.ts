import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  const now = new Date().toISOString();
  const a = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','1','Satu')`).run();
  const b = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','2','Dua')`).run();
  db.prepare(`INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at) VALUES (?, 0.5, 0.1, 0.4, 1, ?)`).run(Number(a.lastInsertRowid), now);
  db.prepare(`INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at) VALUES (?, 0.2, 0.3, -0.1, 2, ?)`).run(Number(b.lastInsertRowid), now);
});

describe('GET /api/ranking', () => {
  it('returns rows ordered by ranking ascending', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].altCode).toBe('A1');
    expect(body[0].ranking).toBe(1);
  });
});
