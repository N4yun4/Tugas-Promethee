import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapKriteriaRow } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await request.json();

  const existing = db.prepare('SELECT * FROM kriteria WHERE id = ?').get(params.id) as any;
  if (!existing) return NextResponse.json({ error: 'Kriteria tidak ditemukan' }, { status: 404 });

  if (body.jenis !== 'benefit' && body.jenis !== 'cost') {
    return NextResponse.json({ error: "Jenis harus 'benefit' atau 'cost'" }, { status: 400 });
  }
  if (body.preferenceFunction !== 'usual' && body.preferenceFunction !== 'linear') {
    return NextResponse.json({ error: "Preference function harus 'usual' atau 'linear'" }, { status: 400 });
  }
  if (body.preferenceFunction === 'linear' && (body.parameterP === null || body.parameterP === undefined)) {
    return NextResponse.json({ error: 'Parameter p wajib diisi untuk fungsi Linear' }, { status: 400 });
  }
  if (typeof body.bobot !== 'number' || body.bobot <= 0) {
    return NextResponse.json({ error: 'Bobot harus berupa angka positif' }, { status: 400 });
  }

  db.prepare('UPDATE kriteria SET nama = ?, jenis = ?, bobot = ?, preference_function = ?, parameter_p = ? WHERE id = ?').run(
    body.nama ?? existing.nama,
    body.jenis,
    body.bobot,
    body.preferenceFunction,
    body.preferenceFunction === 'usual' ? null : body.parameterP,
    params.id
  );

  const row = db.prepare('SELECT * FROM kriteria WHERE id = ?').get(params.id);
  return NextResponse.json(mapKriteriaRow(row));
}
