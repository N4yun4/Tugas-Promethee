'use client';

import Link from 'next/link';
import { useAppState } from '@/lib/useAppState';
import { getRankingRows } from '@/lib/store';
import { PageSkeleton } from '@/components/PageSkeleton';
import { IconTrophy, IconMedal, IconAlertTriangle } from '@/components/icons';

export default function RankingPage() {
  const state = useAppState();
  if (!state) return <PageSkeleton />;
  const rows = getRankingRows(state);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Hasil Ranking</h1>
          <p className="page-subtitle">Diurutkan berdasarkan nilai preferensi TOPSIS (V) dari yang tertinggi.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary">
          <IconTrophy className="h-4 w-4 text-accent" />
          {rows.length} mahasiswa
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Belum ada hasil. Jalankan perhitungan terlebih dahulu di halaman{' '}
            <Link href="/proses" className="font-medium underline">
              Proses TOPSIS
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 table-head shadow-sm">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">Peringkat</th>
                  <th className="px-4 py-3">NIM</th>
                  <th className="min-w-[12rem] px-4 py-3">Nama</th>
                  <th className="px-4 py-3 text-right">D+</th>
                  <th className="px-4 py-3 text-right">D−</th>
                  <th className="px-4 py-3 text-right">Preferensi (V)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.altCode} className={`table-row ${r.ranking <= 3 ? 'bg-accent/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.ranking <= 3 ? (
                          <IconMedal className={`h-4 w-4 ${r.ranking === 1 ? 'text-accent' : r.ranking === 2 ? 'text-slate-400' : 'text-amber-700'}`} />
                        ) : null}
                        <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">#{r.ranking}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-700">{r.nim}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.nama}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{r.dPlus.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{r.dMinus.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-primary">{r.preferensi.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
