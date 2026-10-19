import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow,
              h.processed_at as processedAt
       FROM hasil_ranking h
       JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all();
  return NextResponse.json(rows);
}
