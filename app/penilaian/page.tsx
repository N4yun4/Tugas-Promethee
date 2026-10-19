import { getDb } from '@/lib/db';
import { PenilaianManager } from './PenilaianManager';
import type { PenilaianRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function PenilaianPage() {
  const db = getDb();
  const mahasiswaRows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
  const penilaianRows = db
    .prepare(
      `SELECT p.mahasiswa_id as mahasiswaId, k.kode as kode, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id`
    )
    .all() as { mahasiswaId: number; kode: string; nilai: number }[];

  const nilaiByMahasiswa = new Map<number, Record<string, number>>();
  for (const row of penilaianRows) {
    if (!nilaiByMahasiswa.has(row.mahasiswaId)) nilaiByMahasiswa.set(row.mahasiswaId, {});
    nilaiByMahasiswa.get(row.mahasiswaId)![row.kode] = row.nilai;
  }

  const data: PenilaianRow[] = mahasiswaRows.map((m) => ({
    mahasiswaId: m.id,
    altCode: m.alt_code,
    nim: m.nim,
    nama: m.nama,
    nilai: nilaiByMahasiswa.get(m.id) ?? {},
  }));

  return <PenilaianManager initialData={data} />;
}
