import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateRankingExcel } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow
       FROM hasil_ranking h
       JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all() as any[];

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Belum ada hasil ranking. Jalankan Proses PROMETHEE terlebih dahulu.' }, { status: 400 });
  }

  const buffer = await generateRankingExcel(rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Ranking_PROMETHEE.xlsx"',
    },
  });
}
