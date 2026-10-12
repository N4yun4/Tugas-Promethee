import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runPromethee, type Alternatif, type Kriteria as EngineKriteria } from '@/lib/promethee';

export async function POST() {
  const db = getDb();

  const mahasiswaRows = db.prepare('SELECT id FROM mahasiswa').all() as { id: number }[];
  if (mahasiswaRows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data mahasiswa untuk diproses' }, { status: 400 });
  }

  const kriteriaRows = db.prepare('SELECT * FROM kriteria').all() as any[];
  if (kriteriaRows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data kriteria untuk diproses' }, { status: 400 });
  }
  const engineKriteria: EngineKriteria[] = kriteriaRows.map((k) => ({
    kode: k.kode,
    jenis: k.jenis,
    bobot: k.bobot,
    preferenceFunction: k.preference_function,
    parameterP: k.parameter_p,
  }));

  const penilaianRows = db
    .prepare(
      `SELECT p.mahasiswa_id as mahasiswaId, k.kode as kode, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id`
    )
    .all() as { mahasiswaId: number; kode: string; nilai: number }[];

  const nilaiByMahasiswa = new Map<number, Record<string, number>>();
  for (const row of penilaianRows) {
    if (!nilaiByMahasiswa.has(row.mahasiswaId)) nilaiByMahasiswa.set(row.mahasiswaId, {});
    nilaiByMahasiswa.get(row.mahasiswaId)![row.kode] = row.nilai;
  }

  const alternatifList: Alternatif[] = [];
  for (const m of mahasiswaRows) {
    const nilai = nilaiByMahasiswa.get(m.id);
    if (!nilai || engineKriteria.some((k) => nilai[k.kode] === undefined)) {
      return NextResponse.json(
        { error: `Mahasiswa id ${m.id} belum memiliki nilai lengkap untuk semua kriteria` },
        { status: 400 }
      );
    }
    alternatifList.push({ id: String(m.id), nilai });
  }

  const start = Date.now();
  const result = runPromethee(alternatifList, engineKriteria);
  const durationMs = Date.now() - start;
  const processedAt = new Date().toISOString();

  const deleteAll = db.prepare('DELETE FROM hasil_ranking');
  const insert = db.prepare(
    `INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    deleteAll.run();
    for (const r of result) {
      insert.run(Number(r.id), r.leavingFlow, r.enteringFlow, r.netFlow, r.ranking, processedAt);
    }
  });
  tx();

  return NextResponse.json({ processedAt, durationMs, alternatifCount: alternatifList.length });
}
