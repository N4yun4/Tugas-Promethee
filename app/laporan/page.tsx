import Link from 'next/link';
import { IconUsers, IconSliders, IconClipboard, IconTrophy, IconFileText, IconChevronRight } from '@/components/icons';
import { ExportExcelButton } from './ExportExcelButton';

const JENIS_LAPORAN = [
  { key: 'mahasiswa', label: 'Data Mahasiswa', description: 'Daftar seluruh alternatif (mahasiswa).', icon: IconUsers },
  { key: 'kriteria', label: 'Data Kriteria', description: 'Bobot dan fungsi preferensi tiap kriteria.', icon: IconSliders },
  { key: 'penilaian', label: 'Data Penilaian', description: 'Nilai C1&ndash;C5 setiap mahasiswa.', icon: IconClipboard },
  { key: 'ranking', label: 'Hasil Ranking PROMETHEE', description: 'Peringkat akhir berdasarkan Net Flow.', icon: IconTrophy },
];

export default function LaporanPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Laporan</h1>
        <p className="mt-1 text-sm text-muted">Pratinjau, cetak, atau unduh laporan hasil pengolahan data.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {JENIS_LAPORAN.map((j) => {
          const Icon = j.icon;
          return (
            <div key={j.key} className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{j.label}</p>
                  <p className="mt-0.5 text-sm text-muted">{j.description}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/laporan/preview/${j.key}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-muted-bg"
                >
                  <IconFileText className="h-4 w-4" />
                  Preview
                  <IconChevronRight className="h-3.5 w-3.5" />
                </Link>
                {j.key === 'ranking' && <ExportExcelButton />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
