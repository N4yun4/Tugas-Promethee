import path from 'path';
import { createDb, DEFAULT_DB_PATH } from '../lib/db';
import { runSeed } from '../lib/seedCore';

async function main() {
  const db = createDb(DEFAULT_DB_PATH);
  const matriksPath = path.join(process.cwd(), 'dataset_promethee.xlsx');
  const result = await runSeed(db, matriksPath);

  if (result.skipped) {
    console.log(`Database sudah berisi ${result.mahasiswaCount} mahasiswa, seed dibatalkan. Hapus data/spk.db untuk seed ulang.`);
    return;
  }

  console.log(`Seed selesai: ${result.mahasiswaCount} mahasiswa, ${result.kriteriaCount} kriteria, ${result.penilaianCount} baris penilaian.`);
}

main().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
