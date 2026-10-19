import { getDb } from '@/lib/db';
import { IconTrophy, IconMedal, IconAlertTriangle } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default function RankingPage() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all() as { ranking: number; altCode: string; nim: string; nama: string; leavingFlow: number; enteringFlow: number; netFlow: number }[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Hasil Ranking</h1>
          <p className="mt-1 text-sm text-muted">Diurutkan berdasarkan Net Flow dari yang tertinggi.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted-bg px-3 py-1 text-sm font-medium text-slate-700">
          <IconTrophy className="h-4 w-4 text-accent" />
          {rows.length} mahasiswa
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Belum ada hasil. Jalankan Proses PROMETHEE terlebih dahulu di halaman Proses PROMETHEE.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted-bg text-xs font-medium uppercase tracking-wide text-muted shadow-sm">
                <tr>
                  <th className="px-4 py-3">Peringkat</th>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3 text-right">Leaving Flow</th>
                  <th className="px-4 py-3 text-right">Entering Flow</th>
                  <th className="px-4 py-3 text-right">Net Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.altCode} className={`transition-colors hover:bg-muted-bg/60 ${r.ranking <= 3 ? 'bg-accent/5' : ''}`}>
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
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{r.leavingFlow.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600">{r.enteringFlow.toFixed(6)}</td>
                    <td className={`px-4 py-3 text-right font-mono tabular-nums font-semibold ${r.netFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {r.netFlow.toFixed(6)}
                    </td>
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
