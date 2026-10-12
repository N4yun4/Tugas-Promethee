import { describe, it, expect } from 'vitest';
import path from 'path';
import { createDb } from './db';
import { runSeed } from './seedCore';

describe('runSeed', () => {
  it('seeds 254 mahasiswa, 5 kriteria, and 1270 penilaian from the real dataset', async () => {
    const db = createDb(':memory:');
    const matriksPath = path.join(process.cwd(), 'dataset_promethee.xlsx');

    const result = await runSeed(db, matriksPath);

    expect(result.mahasiswaCount).toBe(254);
    expect(result.kriteriaCount).toBe(5);
    expect(result.penilaianCount).toBe(1270);
    expect(result.skipped).toBe(false);

    const a1 = db.prepare('SELECT * FROM mahasiswa WHERE alt_code = ?').get('A1') as any;
    expect(a1.nim).toBe('236661001');
    expect(a1.nama).toBe('Irvan Topa');
  });

  it('refuses to reseed a database that already has mahasiswa rows', async () => {
    const db = createDb(':memory:');
    const matriksPath = path.join(process.cwd(), 'dataset_promethee.xlsx');
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();

    const result = await runSeed(db, matriksPath);

    expect(result.skipped).toBe(true);
    expect(result.mahasiswaCount).toBe(1);
  });
});
