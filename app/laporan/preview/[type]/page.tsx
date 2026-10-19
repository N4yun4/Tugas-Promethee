import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['mahasiswa', 'kriteria', 'penilaian', 'ranking'] as const;
type LaporanType = (typeof VALID_TYPES)[number];

export default function PreviewLaporanPage({ params }: { params: { type: string } }) {
  if (!VALID_TYPES.includes(params.type as LaporanType)) notFound();
  const type = params.type as LaporanType;
  const db = getDb();
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Preview Laporan</h1>
        <PrintButton />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 print:border-0 print:p-0">
        <h2 className="text-center text-lg font-semibold">Laporan {labelFor(type)}</h2>
        <p className="text-center text-sm text-slate-500">Tanggal cetak: {tanggal}</p>
        <div className="mt-4">{renderTable(type, db)}</div>
      </div>
    </div>
  );
}

function labelFor(type: LaporanType): string {
  return {
    mahasiswa: 'Data Mahasiswa',
    kriteria: 'Data Kriteria',
    penilaian: 'Data Penilaian',
    ranking: 'Hasil Ranking PROMETHEE',
  }[type];
}

function renderTable(type: LaporanType, db: ReturnType<typeof getDb>) {
  if (type === 'mahasiswa') {
    const rows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Alt.</th>
            <th className="border px-2 py-1">NIM</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">Program Studi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="border px-2 py-1">{r.alt_code}</td>
              <td className="border px-2 py-1">{r.nim}</td>
              <td className="border px-2 py-1">{r.nama}</td>
              <td className="border px-2 py-1">{r.program_studi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'kriteria') {
    const rows = db.prepare('SELECT * FROM kriteria ORDER BY kode').all() as any[];
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Kode</th>
            <th className="border px-2 py-1">Kriteria</th>
            <th className="border px-2 py-1">Jenis</th>
            <th className="border px-2 py-1">Bobot</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="border px-2 py-1">{r.kode}</td>
              <td className="border px-2 py-1">{r.nama}</td>
              <td className="border px-2 py-1 capitalize">{r.jenis}</td>
              <td className="border px-2 py-1 font-mono">{Number(r.bobot).toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'penilaian') {
    const mahasiswaRows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
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
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">NIM</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">C1</th>
            <th className="border px-2 py-1">C2</th>
            <th className="border px-2 py-1">C3</th>
            <th className="border px-2 py-1">C4</th>
            <th className="border px-2 py-1">C5</th>
          </tr>
        </thead>
        <tbody>
          {mahasiswaRows.map((m) => {
            const nilai = nilaiByMahasiswa.get(m.id) ?? {};
            return (
              <tr key={m.id}>
                <td className="border px-2 py-1">{m.nim}</td>
                <td className="border px-2 py-1">{m.nama}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C1 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C2 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C3 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C4 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C5 ?? '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all() as { ranking: number; nim: string; nama: string; leavingFlow: number; enteringFlow: number; netFlow: number }[];
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr>
          <th className="border px-2 py-1">Peringkat</th>
          <th className="border px-2 py-1">NIM</th>
          <th className="border px-2 py-1">Nama</th>
          <th className="border px-2 py-1">Leaving</th>
          <th className="border px-2 py-1">Entering</th>
          <th className="border px-2 py-1">Net Flow</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.nim}>
            <td className="border px-2 py-1">{r.ranking}</td>
            <td className="border px-2 py-1">{r.nim}</td>
            <td className="border px-2 py-1">{r.nama}</td>
            <td className="border px-2 py-1 font-mono">{r.leavingFlow.toFixed(6)}</td>
            <td className="border px-2 py-1 font-mono">{r.enteringFlow.toFixed(6)}</td>
            <td className="border px-2 py-1 font-mono">{r.netFlow.toFixed(6)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
