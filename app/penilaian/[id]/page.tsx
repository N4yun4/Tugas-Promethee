import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function DetailPenilaianPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const mahasiswa = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id) as any;
  if (!mahasiswa) notFound();

  const nilaiRows = db
    .prepare(
      `SELECT k.kode as kode, k.nama as nama, k.jenis as jenis, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id
       WHERE p.mahasiswa_id = ?
       ORDER BY k.kode`
    )
    .all(params.id) as { kode: string; nama: string; jenis: string; nilai: number }[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Detail Penilaian</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p>
          <span className="text-slate-500">NIM:</span> {mahasiswa.nim}
        </p>
        <p>
          <span className="text-slate-500">Nama:</span> {mahasiswa.nama}
        </p>
        <p>
          <span className="text-slate-500">Program Studi:</span> {mahasiswa.program_studi}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Kode</th>
              <th className="px-4 py-2">Kriteria</th>
              <th className="px-4 py-2">Jenis</th>
              <th className="px-4 py-2">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {nilaiRows.map((n) => (
              <tr key={n.kode} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{n.kode}</td>
                <td className="px-4 py-2">{n.nama}</td>
                <td className="px-4 py-2 capitalize">{n.jenis}</td>
                <td className="px-4 py-2 font-mono">{n.nilai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
