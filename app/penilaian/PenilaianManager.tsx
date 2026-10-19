'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PenilaianRow } from '@/lib/types';
import { ImportButton } from './ImportButton';
import { IconSearch, IconPencil, IconClipboard, IconChevronLeft, IconChevronRight, IconX } from '@/components/icons';

const PAGE_SIZE = 20;
const KRITERIA_KODE = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;
const KRITERIA_LABEL: Record<(typeof KRITERIA_KODE)[number], string> = {
  C1: 'Kehadiran',
  C2: 'Alfa',
  C3: 'Izin',
  C4: 'Sakit',
  C5: 'IPK',
};

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Data Penilaian</h1>
          <p className="mt-1 text-sm text-muted">Nilai C1&ndash;C5 setiap mahasiswa sebagai input PROMETHEE.</p>
        </div>
        <ImportButton onImported={() => router.refresh()} />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 rounded p-1 hover:bg-red-100" aria-label="Tutup pesan error">
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Cari NIM atau nama..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm transition-colors focus:border-primary"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted-bg text-xs font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Alt.</th>
                <th className="px-4 py-3">NIM</th>
                <th className="px-4 py-3">Nama</th>
                {KRITERIA_KODE.map((k) => (
                  <th key={k} className="px-4 py-3 text-right" title={KRITERIA_LABEL[k]}>
                    {k}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((r) => (
                <tr key={r.mahasiswaId} className="transition-colors hover:bg-muted-bg/60">
                  <td className="px-4 py-3 font-mono text-slate-600">{r.altCode}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-700">{r.nim}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.nama}</td>
                  {KRITERIA_KODE.map((k) => (
                    <td key={k} className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {r.nilai[k] ?? <span className="text-amber-600">&ndash;</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(r)}
                        aria-label={`Edit nilai ${r.nama}`}
                        title="Edit nilai"
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/penilaian/${r.mahasiswaId}`}
                        aria-label={`Lihat detail ${r.nama}`}
                        title="Detail"
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-muted-bg hover:text-slate-900"
                      >
                        <IconClipboard className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <span>
          Menampilkan <span className="font-medium text-slate-700">{pageRows.length}</span> dari{' '}
          <span className="font-medium text-slate-700">{filtered.length}</span> mahasiswa
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Halaman sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[5rem] text-center font-medium text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Halaman berikutnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconChevronRight className="h-4 w-4" />
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
        onError(`Nilai ${k} (${KRITERIA_LABEL[k]}) wajib diisi dengan angka`);
        return;
      }
      nilai[k] = Number(raw);
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/penilaian/${row.mahasiswaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nilai }),
      });
      const body = await res.json().catch(() => ({ error: 'Gagal menyimpan nilai' }));
      if (!res.ok) {
        onError(body.error ?? 'Gagal menyimpan nilai');
        return;
      }
      onSaved();
    } catch {
      onError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl bg-surface p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Edit Nilai &middot; {row.altCode} {row.nama}
          </h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md p-1 text-muted hover:bg-muted-bg hover:text-slate-900">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {KRITERIA_KODE.map((k) => (
            <div key={k}>
              <label className="block text-sm font-medium text-slate-700">
                {k} <span className="font-normal text-muted">({KRITERIA_LABEL[k]})</span>
              </label>
              <input
                value={values[k]}
                onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                inputMode="decimal"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-mono text-sm transition-colors focus:border-primary"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-muted-bg">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
