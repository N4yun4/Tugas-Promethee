import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { IconChevronLeft, IconUsers } from '@/components/icons';

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
    <div className="space-y-5">
      <div>
        <Link href="/penilaian" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <IconChevronLeft className="h-4 w-4" />
          Kembali ke Data Penilaian
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Detail Penilaian</h1>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconUsers className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{mahasiswa.nama}</p>
          <p className="font-mono text-sm tabular-nums text-muted">
            {mahasiswa.alt_code} &middot; NIM {mahasiswa.nim}
          </p>
          <p className="text-sm text-muted">{mahasiswa.program_studi}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted-bg text-xs font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Kriteria</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {nilaiRows.map((n) => (
                <tr key={n.kode} className="transition-colors hover:bg-muted-bg/60">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">{n.kode}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{n.nama}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        n.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {n.jenis === 'benefit' ? 'Benefit' : 'Cost'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">{n.nilai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
