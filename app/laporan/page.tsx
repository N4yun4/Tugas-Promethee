import Link from 'next/link';
import { IconUsers, IconSliders, IconClipboard, IconTrophy, IconFileText, IconChevronRight } from '@/components/icons';
import { ExportExcelButton } from './ExportExcelButton';

const JENIS_LAPORAN = [
  { key: 'mahasiswa', label: 'Data Mahasiswa', description: 'Daftar seluruh alternatif (mahasiswa).', icon: IconUsers },
  { key: 'kriteria', label: 'Data Kriteria', description: 'Bobot dan fungsi preferensi tiap kriteria.', icon: IconSliders },
  { key: 'penilaian', label: 'Data Penilaian', description: 'Nilai C1–C5 setiap mahasiswa.', icon: IconClipboard },
  { key: 'ranking', label: 'Hasil Ranking PROMETHEE', description: 'Peringkat akhir berdasarkan Net Flow.', icon: IconTrophy },
];

export default function LaporanPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Laporan</h1>
        <p className="page-subtitle">Pratinjau, cetak, atau unduh laporan hasil pengolahan data.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {JENIS_LAPORAN.map((j) => {
          const Icon = j.icon;
          return (
            <div key={j.key} className="card flex flex-col p-5 transition-shadow duration-200 hover:shadow-glow">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                  className="btn-secondary"
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
