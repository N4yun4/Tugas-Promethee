import { getDb } from '@/lib/db';

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
      `SELECT h.ranking as ranking, m.nama as nama, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC LIMIT 5`
    )
    .all() as { ranking: number; nama: string; netFlow: number }[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Mahasiswa" value={mahasiswaCount} />
        <StatCard label="Total Kriteria" value={kriteriaCount} />
        <StatCard label="Total Penilaian" value={penilaianCount} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Status Proses PROMETHEE</p>
        <p className="mt-1 text-lg font-medium text-slate-900">
          {lastProcessed ? `Terakhir diproses: ${new Date(lastProcessed.processedAt).toLocaleString('id-ID')}` : 'Belum pernah diproses'}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Ranking Lima Besar</p>
        {top5.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada hasil ranking.</p>
        ) : (
          <ol className="space-y-2">
            {top5.map((row) => (
              <li key={row.ranking} className="flex items-center justify-between text-sm">
                <span>#{row.ranking} {row.nama}</span>
                <span className="font-mono text-slate-600">{row.netFlow.toFixed(6)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
