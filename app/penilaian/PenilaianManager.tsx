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
  const [editing, setEditing] = useState<PenilaianRow | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

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
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => setEditing(r)} className="text-slate-600 hover:underline">
                    Edit
                  </button>
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

      {editing && (
        <PenilaianFormModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function PenilaianFormModal({
  row,
  onClose,
  onSaved,
  onError,
}: {
  row: PenilaianRow;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const k of KRITERIA_KODE) initial[k] = row.nilai[k] != null ? String(row.nilai[k]) : '';
    return initial;
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nilai: Record<string, number> = {};
    for (const k of KRITERIA_KODE) {
      const raw = values[k].trim();
      if (raw === '' || Number.isNaN(Number(raw))) {
        onError(`Nilai ${k} wajib diisi dengan angka`);
        return;
      }
      nilai[k] = Number(raw);
    }

    setSaving(true);
    const res = await fetch(`/api/penilaian/${row.mahasiswaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nilai }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Gagal menyimpan nilai' }));
      onError(body.error ?? 'Gagal menyimpan nilai');
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">
          Edit Nilai - {row.altCode} {row.nama}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {KRITERIA_KODE.map((k) => (
            <div key={k}>
              <label className="block text-sm font-medium text-slate-700">{k}</label>
              <input
                value={values[k]}
                onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                inputMode="decimal"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">
            Batal
          </button>
          <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
