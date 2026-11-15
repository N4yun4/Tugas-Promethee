'use client';

import { useAppState, resetAppState } from '@/lib/useAppState';
import { getRankingRows } from '@/lib/store';
import { PageSkeleton } from '@/components/PageSkeleton';
import { IconUsers, IconSliders, IconClipboard, IconMedal, IconCheckCircle, IconAlertTriangle } from '@/components/icons';

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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Ringkasan data dan status perhitungan PROMETHEE II.</p>
        </div>
        <button
          onClick={handleReset}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-muted-bg"
        >
          Reset ke data awal
        </button>
      </div>

      <p className="rounded-lg border border-border bg-muted-bg px-4 py-3 text-sm text-slate-600">
        Perubahan data (tambah, edit, hapus, import, dan hasil proses) disimpan di browser ini saja dan tidak terlihat oleh pengunjung lain.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={IconUsers} label="Total Mahasiswa" value={mahasiswaCount} />
        <StatCard icon={IconSliders} label="Total Kriteria" value={kriteriaCount} />
        <StatCard icon={IconClipboard} label="Total Penilaian" value={penilaianCount} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-700">Status Proses PROMETHEE</p>
        <div className="mt-2 flex items-center gap-2">
          {state.processedAt ? (
            <>
              <IconCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm text-slate-900">
                Terakhir diproses:{' '}
                <span className="font-mono tabular-nums">{new Date(state.processedAt).toLocaleString('id-ID')}</span>
              </p>
            </>
          ) : (
            <>
              <IconAlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-slate-900">Belum pernah diproses. Buka halaman Proses PROMETHEE untuk memulai.</p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <IconMedal className="h-5 w-5 text-accent" />
          <p className="text-sm font-semibold text-slate-900">Ranking Lima Besar</p>
        </div>
        {top5.length === 0 ? (
          <p className="text-sm text-muted">Belum ada hasil ranking.</p>
        ) : (
          <ol className="divide-y divide-border">
            {top5.map((row) => (
              <li key={row.altCode} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      row.ranking === 1
                        ? 'bg-accent/15 text-accent'
                        : 'bg-muted-bg text-slate-600'
                    }`}
                  >
                    {row.ranking}
                  </span>
                  <span className="truncate text-slate-800">{row.nama}</span>
                </div>
                <span className="shrink-0 font-mono text-sm tabular-nums text-slate-600">{row.netFlow.toFixed(6)}</span>
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
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
