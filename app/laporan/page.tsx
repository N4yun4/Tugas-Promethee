import Link from 'next/link';

const JENIS_LAPORAN = [
  { key: 'mahasiswa', label: 'Data Mahasiswa' },
  { key: 'kriteria', label: 'Data Kriteria' },
  { key: 'penilaian', label: 'Data Penilaian' },
  { key: 'ranking', label: 'Hasil Ranking PROMETHEE' },
];

export default function LaporanPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Laporan</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {JENIS_LAPORAN.map((j) => (
          <div key={j.key} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-900">{j.label}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/laporan/preview/${j.key}`} className="rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                Preview
              </Link>
              {j.key === 'ranking' && (
                <a href="/api/laporan/export/excel" className="rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  Export Excel
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
