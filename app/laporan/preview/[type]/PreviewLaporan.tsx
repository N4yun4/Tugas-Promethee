'use client';

import Link from 'next/link';
import { useAppState } from '@/lib/useAppState';
import { formatNilai } from '@/lib/format';
import { getMahasiswaSorted, getPenilaianRows, getRankingRows, type AppState } from '@/lib/store';
import { PageSkeleton } from '@/components/PageSkeleton';
import { IconChevronLeft } from '@/components/icons';
import { PrintButton } from './PrintButton';
import type { LaporanType } from './laporanTypes';

const LABEL: Record<LaporanType, string> = {
  mahasiswa: 'Data Mahasiswa',
  kriteria: 'Data Kriteria',
  penilaian: 'Data Penilaian',
  ranking: 'Hasil Ranking PROMETHEE',
};

export function PreviewLaporan({ type }: { type: LaporanType }) {
  const state = useAppState();
  if (!state) return <PageSkeleton />;
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/laporan" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <IconChevronLeft className="h-4 w-4" />
            Kembali ke Laporan
          </Link>
          <h1 className="mt-2 page-title">Preview Laporan</h1>
        </div>
        <PrintButton />
      </div>

      <div className="card p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <h2 className="text-center text-lg font-semibold text-slate-900">Laporan {LABEL[type]}</h2>
        <p className="text-center text-sm text-muted">Tanggal cetak: {tanggal}</p>
        <div className="mt-4 overflow-x-auto">
          <ReportTable type={type} state={state} />
        </div>
      </div>
    </div>
  );
}

const th = 'border px-2 py-1';
const td = 'border px-2 py-1';

function ReportTable({ type, state }: { type: LaporanType; state: AppState }) {
  if (type === 'mahasiswa') {
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className={th}>Alt.</th>
            <th className={th}>NIM</th>
            <th className={th}>Nama</th>
            <th className={th}>Program Studi</th>
          </tr>
        </thead>
        <tbody>
          {getMahasiswaSorted(state).map((m) => (
            <tr key={m.id}>
              <td className={td}>{m.altCode}</td>
              <td className={td}>{m.nim}</td>
              <td className={td}>{m.nama}</td>
              <td className={td}>{m.programStudi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'kriteria') {
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className={th}>Kode</th>
            <th className={th}>Kriteria</th>
            <th className={th}>Jenis</th>
            <th className={th}>Bobot</th>
          </tr>
        </thead>
        <tbody>
          {[...state.kriteria]
            .sort((a, b) => a.kode.localeCompare(b.kode))
            .map((k) => (
              <tr key={k.id}>
                <td className={td}>{k.kode}</td>
                <td className={td}>{k.nama}</td>
                <td className={`${td} capitalize`}>{k.jenis}</td>
                <td className={`${td} font-mono`}>{k.bobot.toFixed(6)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  }

  if (type === 'penilaian') {
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className={th}>NIM</th>
            <th className={th}>Nama</th>
            {['C1', 'C2', 'C3', 'C4', 'C5'].map((k) => (
              <th key={k} className={th}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getPenilaianRows(state).map((r) => (
            <tr key={r.mahasiswaId}>
              <td className={td}>{r.nim}</td>
              <td className={td}>{r.nama}</td>
              {['C1', 'C2', 'C3', 'C4', 'C5'].map((k) => (
                <td key={k} className={`${td} font-mono`}>
                  {r.nilai[k] !== undefined ? formatNilai(r.nilai[k]) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const rows = getRankingRows(state);
  if (rows.length === 0) {
    return <p className="text-center text-sm text-muted">Belum ada hasil ranking. Jalankan Proses PROMETHEE terlebih dahulu.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr>
          <th className={th}>Peringkat</th>
          <th className={th}>NIM</th>
          <th className={th}>Nama</th>
          <th className={th}>Leaving</th>
          <th className={th}>Entering</th>
          <th className={th}>Net Flow</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.mahasiswaId}>
            <td className={td}>{r.ranking}</td>
            <td className={td}>{r.nim}</td>
            <td className={td}>{r.nama}</td>
            <td className={`${td} font-mono`}>{r.leavingFlow.toFixed(6)}</td>
            <td className={`${td} font-mono`}>{r.enteringFlow.toFixed(6)}</td>
            <td className={`${td} font-mono`}>{r.netFlow.toFixed(6)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
