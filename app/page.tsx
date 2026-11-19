'use client';

import Link from 'next/link';
import { useAppState, resetAppState } from '@/lib/useAppState';
import { getRankingRows } from '@/lib/store';
import { PageSkeleton } from '@/components/PageSkeleton';
import { IconUsers, IconSliders, IconClipboard, IconMedal, IconCheckCircle, IconAlertTriangle, IconPlay } from '@/components/icons';

export default function DashboardPage() {
  const state = useAppState();
  if (!state) return <PageSkeleton />;

  const mahasiswaCount = state.mahasiswa.length;
  const kriteriaCount = state.kriteria.length;
  const penilaianCount = Object.values(state.penilaian).reduce((sum, nilai) => sum + Object.keys(nilai).length, 0);
  const top5 = getRankingRows(state).slice(0, 5);

  function handleReset() {
    if (!confirm('Kembalikan semua data ke data awal (254 mahasiswa)? Perubahan yang kamu buat di browser ini akan hilang.')) return;
    resetAppState();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Ringkasan data dan status perhitungan TOPSIS.</p>
        </div>
        <button
          onClick={handleReset}
          className="btn-secondary"
        >
          Reset ke data awal
        </button>
      </div>

      <p className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-ink">
        Perubahan data (tambah, edit, hapus, import, dan hasil proses) disimpan di browser ini saja dan tidak terlihat oleh pengunjung lain.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={IconUsers} label="Total Mahasiswa" value={mahasiswaCount} />
        <StatCard icon={IconSliders} label="Total Kriteria" value={kriteriaCount} />
        <StatCard icon={IconClipboard} label="Total Penilaian" value={penilaianCount} />
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-bold text-ink">Status Proses TOPSIS</p>
          <div className="mt-1.5 flex items-center gap-2">
            {state.processedAt ? (
              <>
                <IconCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm text-slate-700">
                  Terakhir diproses:{' '}
                  <span className="font-mono tabular-nums">{new Date(state.processedAt).toLocaleString('id-ID')}</span>
                </p>
              </>
            ) : (
              <>
                <IconAlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-slate-700">Belum pernah diproses.</p>
              </>
            )}
          </div>
        </div>
        <Link href="/proses" className="btn-primary">
          <IconPlay className="h-4 w-4" />
          {state.processedAt ? 'Proses ulang' : 'Mulai proses'}
        </Link>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconMedal className="h-5 w-5 text-accent" />
            <p className="text-sm font-bold text-ink">Ranking Lima Besar</p>
          </div>
          {top5.length > 0 && (
            <Link href="/ranking" className="text-sm font-semibold text-primary hover:underline">
              Lihat semua
            </Link>
          )}
        </div>
        {top5.length === 0 ? (
          <p className="text-sm text-muted">Belum ada hasil ranking.</p>
        ) : (
          <ol className="divide-y divide-border">
            {top5.map((row) => (
              <li key={row.altCode} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      row.ranking === 1
                        ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-glow'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {row.ranking}
                  </span>
                  <span className="truncate font-semibold text-ink">{row.nama}</span>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums text-slate-600">{row.preferensi.toFixed(6)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: (props: { className?: string }) => JSX.Element;
  label: string;
  value: number;
}) {
  return (
    <div className="card p-5 transition-shadow duration-200 hover:shadow-glow">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-muted">{label}</p>
      </div>
      <p className="mt-4 text-4xl font-extrabold tracking-tight text-ink">{value}</p>
    </div>
  );
}
