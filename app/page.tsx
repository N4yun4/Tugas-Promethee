import { getDb } from '@/lib/db';
import { IconUsers, IconSliders, IconClipboard, IconMedal, IconCheckCircle, IconAlertTriangle } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const db = getDb();
  const mahasiswaCount = (db.prepare('SELECT COUNT(*) as c FROM mahasiswa').get() as { c: number }).c;
  const kriteriaCount = (db.prepare('SELECT COUNT(*) as c FROM kriteria').get() as { c: number }).c;
  const penilaianCount = (db.prepare('SELECT COUNT(*) as c FROM penilaian').get() as { c: number }).c;
  const lastProcessed = db
    .prepare('SELECT processed_at as processedAt FROM hasil_ranking ORDER BY id DESC LIMIT 1')
    .get() as { processedAt: string } | undefined;
  const top5 = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nama as nama, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC LIMIT 5`
    )
    .all() as { ranking: number; altCode: string; nama: string; netFlow: number }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Ringkasan data dan status perhitungan PROMETHEE II.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={IconUsers} label="Total Mahasiswa" value={mahasiswaCount} />
        <StatCard icon={IconSliders} label="Total Kriteria" value={kriteriaCount} />
        <StatCard icon={IconClipboard} label="Total Penilaian" value={penilaianCount} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-700">Status Proses PROMETHEE</p>
        <div className="mt-2 flex items-center gap-2">
          {lastProcessed ? (
            <>
              <IconCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm text-slate-900">
                Terakhir diproses:{' '}
                <span className="font-mono tabular-nums">{new Date(lastProcessed.processedAt).toLocaleString('id-ID')}</span>
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
