import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapMahasiswaRow } from '@/lib/mappers';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();

  const rows = search
    ? db
        .prepare(
          `SELECT * FROM mahasiswa WHERE nim LIKE ? OR nama LIKE ? ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)`
        )
        .all(`%${search}%`, `%${search}%`)
    : db.prepare(`SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)`).all();

  return NextResponse.json(rows.map(mapMahasiswaRow));
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();

  if (!body.nim || !body.nama) {
    return NextResponse.json({ error: 'NIM dan nama wajib diisi' }, { status: 400 });
  }

  const existingNim = db.prepare('SELECT id FROM mahasiswa WHERE nim = ?').get(body.nim);
  if (existingNim) {
    return NextResponse.json({ error: `NIM ${body.nim} sudah terdaftar` }, { status: 409 });
  }

  const maxAlt = db.prepare(`SELECT MAX(CAST(SUBSTR(alt_code, 2) AS INTEGER)) as maxNum FROM mahasiswa`).get() as {
    maxNum: number | null;
  };
  const altCode = `A${(maxAlt.maxNum ?? 0) + 1}`;

  const info = db
    .prepare('INSERT INTO mahasiswa (alt_code, nim, nama, program_studi, angkatan) VALUES (?, ?, ?, ?, ?)')
    .run(altCode, body.nim, body.nama, body.programStudi ?? 'Teknologi Rekayasa Komputer', body.angkatan ?? null);

  const row = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(mapMahasiswaRow(row), { status: 201 });
}
