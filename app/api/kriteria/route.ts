import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapKriteriaRow } from '@/lib/mappers';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM kriteria ORDER BY kode').all();
  return NextResponse.json(rows.map(mapKriteriaRow));
}
