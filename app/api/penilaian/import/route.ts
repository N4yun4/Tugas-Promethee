import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseMatriksKeputusanBuffer } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const db = getDb();
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'File Excel wajib diunggah' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let rows;
  try {
    rows = await parseMatriksKeputusanBuffer(Buffer.from(arrayBuffer));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const kriteriaRows = db.prepare('SELECT id, kode FROM kriteria').all() as { id: number; kode: string }[];
  const kriteriaIdByKode = new Map(kriteriaRows.map((k) => [k.kode, k.id]));

  const findByNim = db.prepare('SELECT id FROM mahasiswa WHERE nim = ?');
  const insertMahasiswa = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (?, ?, ?)');
  const upsertPenilaian = db.prepare(
    `INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)
     ON CONFLICT(mahasiswa_id, kriteria_id) DO UPDATE SET nilai = excluded.nilai`
  );

  let created = 0;
  let updated = 0;

  const tx = db.transaction(() => {
    for (const row of rows) {
      const existing = findByNim.get(row.nim) as { id: number } | undefined;
      let mahasiswaId: number;
      if (existing) {
        mahasiswaId = existing.id;
        updated += 1;
      } else {
        const info = insertMahasiswa.run(row.altCode, row.nim, row.nama);
        mahasiswaId = Number(info.lastInsertRowid);
        created += 1;
      }
      const values: [string, number][] = [
        ['C1', row.c1],
        ['C2', row.c2],
        ['C3', row.c3],
        ['C4', row.c4],
        ['C5', row.c5],
      ];
      for (const [kode, nilai] of values) {
        const kriteriaId = kriteriaIdByKode.get(kode);
        if (kriteriaId) upsertPenilaian.run(mahasiswaId, kriteriaId, nilai);
      }
    }
  });
  tx();

  return NextResponse.json({ created, updated, total: rows.length });
}
