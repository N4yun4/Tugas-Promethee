'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppState } from '@/lib/useAppState';
import { formatNilai } from '@/lib/format';
import { PageSkeleton } from '@/components/PageSkeleton';
import { IconChevronLeft, IconUsers, IconAlertTriangle } from '@/components/icons';

export function DetailPenilaian() {
  const state = useAppState();
  const id = Number(useSearchParams().get('id'));

  if (!state) return <PageSkeleton />;

  const mahasiswa = state.mahasiswa.find((m) => m.id === id);
  const nilai = state.penilaian[id] ?? {};
  const kriteria = [...state.kriteria].sort((a, b) => a.kode.localeCompare(b.kode));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/penilaian" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <IconChevronLeft className="h-4 w-4" />
          Kembali ke Data Penilaian
        </Link>
        <h1 className="mt-2 page-title">Detail Penilaian</h1>
      </div>

      {!mahasiswa ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Mahasiswa tidak ditemukan. Mungkin sudah dihapus.</p>
        </div>
      ) : (
        <>
          <div className="card flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconUsers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">{mahasiswa.nama}</p>
              <p className="font-mono text-sm tabular-nums text-muted">
                {mahasiswa.altCode} &middot; NIM {mahasiswa.nim}
              </p>
              <p className="text-sm text-muted">{mahasiswa.programStudi}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Kriteria</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3 text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kriteria.map((k) => (
                    <tr key={k.kode} className="table-row">
                      <td className="px-4 py-3">
                        <span className="chip-kode">{k.kode}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{k.nama}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            k.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {k.jenis === 'benefit' ? 'Benefit' : 'Cost'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                        {nilai[k.kode] !== undefined ? formatNilai(nilai[k.kode]) : <span className="text-amber-600">belum diisi</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
