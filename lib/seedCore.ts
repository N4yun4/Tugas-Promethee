import type { Db } from './db';
import { parseMatriksKeputusan } from './excel';
import { DEFAULT_KRITERIA } from './defaultKriteria';

const KRITERIA_NAMA: Record<string, string> = {
  C1: 'Kehadiran',
  C2: 'Jumlah Alfa',
  C3: 'Jumlah Izin',
  C4: 'Jumlah Sakit',
  C5: 'Nilai Akademik (IPK)',
};

export interface SeedResult {
  mahasiswaCount: number;
  kriteriaCount: number;
  penilaianCount: number;
  skipped: boolean;
}

export async function runSeed(db: Db, matriksPath: string): Promise<SeedResult> {
  const existing = db.prepare('SELECT COUNT(*) as c FROM mahasiswa').get() as { c: number };
  if (existing.c > 0) {
    return { mahasiswaCount: existing.c, kriteriaCount: 0, penilaianCount: 0, skipped: true };
  }

  const insertKriteria = db.prepare(`
    INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
    VALUES (@kode, @nama, @jenis, @bobot, @preferenceFunction, @parameterP)
  `);
  const kriteriaIdByKode = new Map<string, number>();
  const insertKriteriaTx = db.transaction(() => {
    for (const k of DEFAULT_KRITERIA) {
      const info = insertKriteria.run({
        kode: k.kode,
        nama: KRITERIA_NAMA[k.kode],
        jenis: k.jenis,
        bobot: k.bobot,
        preferenceFunction: k.preferenceFunction,
        parameterP: k.parameterP,
      });
      kriteriaIdByKode.set(k.kode, Number(info.lastInsertRowid));
    }
  });
  insertKriteriaTx();

  const rows = await parseMatriksKeputusan(matriksPath);

  const insertMahasiswa = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (@altCode, @nim, @nama)');
  const insertPenilaian = db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)');
  let penilaianCount = 0;

  const insertAllTx = db.transaction(() => {
    for (const row of rows) {
      const info = insertMahasiswa.run({ altCode: row.altCode, nim: row.nim, nama: row.nama });
      const mahasiswaId = Number(info.lastInsertRowid);
      const values: Record<string, number> = { C1: row.c1, C2: row.c2, C3: row.c3, C4: row.c4, C5: row.c5 };
      for (const kode of Object.keys(values)) {
        insertPenilaian.run(mahasiswaId, kriteriaIdByKode.get(kode), values[kode]);
        penilaianCount += 1;
      }
    }
  });
  insertAllTx();

  return { mahasiswaCount: rows.length, kriteriaCount: DEFAULT_KRITERIA.length, penilaianCount, skipped: false };
}
