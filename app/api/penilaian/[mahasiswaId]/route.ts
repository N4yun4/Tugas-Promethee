import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { mahasiswaId: string } }) {
  const db = getDb();
  const body = await request.json();

  const mahasiswa = db.prepare('SELECT id FROM mahasiswa WHERE id = ?').get(params.mahasiswaId);
  if (!mahasiswa) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });

  const kriteriaRows = db.prepare('SELECT id, kode FROM kriteria').all() as { id: number; kode: string }[];
  const kriteriaIdByKode = new Map(kriteriaRows.map((k) => [k.kode, k.id]));

  const nilaiInput: Record<string, unknown> = body.nilai ?? {};
  for (const kode of Object.keys(nilaiInput)) {
    const kriteriaId = kriteriaIdByKode.get(kode);
    if (!kriteriaId) {
      return NextResponse.json({ error: `Kriteria ${kode} tidak dikenal` }, { status: 400 });
    }
    const nilai = Number(nilaiInput[kode]);
    if (Number.isNaN(nilai)) {
      return NextResponse.json({ error: `Nilai ${kode} harus berupa angka` }, { status: 400 });
    }
    db.prepare(
      `INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)
       ON CONFLICT(mahasiswa_id, kriteria_id) DO UPDATE SET nilai = excluded.nilai`
    ).run(params.mahasiswaId, kriteriaId, nilai);
  }

  const updated = db
    .prepare(
      `SELECT k.kode as kode, p.nilai as nilai FROM penilaian p
       JOIN kriteria k ON k.id = p.kriteria_id WHERE p.mahasiswa_id = ?`
    )
    .all(params.mahasiswaId) as { kode: string; nilai: number }[];

  const nilai: Record<string, number> = {};
  for (const row of updated) nilai[row.kode] = row.nilai;

  return NextResponse.json({ mahasiswaId: Number(params.mahasiswaId), nilai });
}
