import fs from 'fs';
import path from 'path';
import { parseMatriksKeputusan } from '../lib/excel';

async function main() {
  const source = path.join(process.cwd(), 'dataset_promethee.xlsx');
  const target = path.join(process.cwd(), 'lib', 'seed-data.json');
  const rows = await parseMatriksKeputusan(source);
  fs.writeFileSync(target, JSON.stringify({ source: 'dataset_promethee.xlsx#03_Matriks_Keputusan', rows }, null, 2) + '\n');
  console.log(`Seed JSON ditulis ke ${path.relative(process.cwd(), target)}: ${rows.length} mahasiswa.`);
}

main().catch((err) => {
  console.error('Gagal membuat seed JSON:', err);
  process.exit(1);
});
