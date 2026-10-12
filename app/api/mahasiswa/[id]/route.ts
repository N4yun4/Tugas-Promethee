import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapMahasiswaRow } from '@/lib/mappers';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  if (!row) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });
  return NextResponse.json(mapMahasiswaRow(row));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await request.json();

  const existing = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });

  if (!body.nim || !body.nama) {
    return NextResponse.json({ error: 'NIM dan nama wajib diisi' }, { status: 400 });
  }

  const dupeNim = db.prepare('SELECT id FROM mahasiswa WHERE nim = ? AND id != ?').get(body.nim, params.id);
  if (dupeNim) {
    return NextResponse.json({ error: `NIM ${body.nim} sudah dipakai mahasiswa lain` }, { status: 409 });
  }

  db.prepare('UPDATE mahasiswa SET nim = ?, nama = ?, program_studi = ?, angkatan = ? WHERE id = ?').run(
    body.nim,
    body.nama,
    body.programStudi ?? 'Teknologi Rekayasa Komputer',
    body.angkatan ?? null,
    params.id
  );

  const row = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  return NextResponse.json(mapMahasiswaRow(row));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });

  db.prepare('DELETE FROM mahasiswa WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
