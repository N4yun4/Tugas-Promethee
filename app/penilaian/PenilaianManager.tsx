'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PenilaianRow } from '@/lib/types';
import { ImportButton } from './ImportButton';

const PAGE_SIZE = 20;
const KRITERIA_KODE = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;

export function PenilaianManager({ initialData }: { initialData: PenilaianRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialData;
    return initialData.filter((r) => r.nim.toLowerCase().includes(term) || r.nama.toLowerCase().includes(term));
  }, [initialData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Penilaian</h1>
        <ImportButton onImported={() => router.refresh()} />
      </div>

      <input
        type="text"
        placeholder="Cari NIM atau nama..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Alt.</th>
              <th className="px-4 py-2">NIM</th>
              <th className="px-4 py-2">Nama</th>
              {KRITERIA_KODE.map((k) => (
                <th key={k} className="px-4 py-2">
                  {k}
                </th>
              ))}
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.mahasiswaId} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.altCode}</td>
                <td className="px-4 py-2">{r.nim}</td>
                <td className="px-4 py-2">{r.nama}</td>
                {KRITERIA_KODE.map((k) => (
                  <td key={k} className="px-4 py-2 font-mono">
                    {r.nilai[k] ?? '-'}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <Link href={`/penilaian/${r.mahasiswaId}`} className="text-slate-600 hover:underline">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Menampilkan {pageRows.length} dari {filtered.length} mahasiswa
        </span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
            Sebelumnya
          </button>
          <span>
            Hal {page}/{totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
