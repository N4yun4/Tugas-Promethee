import { getDb } from '@/lib/db';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hasil Ranking</h1>
        <span className="text-sm text-slate-500">{rows.length} mahasiswa</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">Belum ada hasil. Jalankan Proses PROMETHEE terlebih dahulu.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Peringkat</th>
                <th className="px-4 py-2">NIM</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Leaving Flow</th>
                <th className="px-4 py-2">Entering Flow</th>
                <th className="px-4 py-2">Net Flow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.altCode} className={`border-t border-slate-100 ${r.ranking <= 3 ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-2 font-semibold">#{r.ranking}</td>
                  <td className="px-4 py-2">{r.nim}</td>
                  <td className="px-4 py-2">{r.nama}</td>
                  <td className="px-4 py-2 font-mono">{r.leavingFlow.toFixed(6)}</td>
                  <td className="px-4 py-2 font-mono">{r.enteringFlow.toFixed(6)}</td>
                  <td className="px-4 py-2 font-mono">{r.netFlow.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
