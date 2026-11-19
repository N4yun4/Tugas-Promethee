'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PenilaianRow } from '@/lib/types';
import { useAppState, setAppState } from '@/lib/useAppState';
import { updatePenilaian, getPenilaianRows, KRITERIA_KODE } from '@/lib/store';
import { PageSkeleton } from '@/components/PageSkeleton';
import { ModalBackdrop } from '@/components/ModalBackdrop';
import { formatNilai } from '@/lib/format';
import { Pagination } from '@/components/Pagination';
import { ImportButton } from './ImportButton';
import { IconSearch, IconPencil, IconClipboard, IconX } from '@/components/icons';

const PAGE_SIZE = 20;
const KRITERIA_LABEL: Record<(typeof KRITERIA_KODE)[number], string> = {
  C1: 'Kehadiran',
  C2: 'Alfa',
  C3: 'Izin',
  C4: 'Sakit',
  C5: 'IPK',
};

export function PenilaianManager() {
  const state = useAppState();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PenilaianRow | null>(null);

  const all = useMemo(() => (state ? getPenilaianRows(state) : []), [state]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((r) => r.nim.toLowerCase().includes(term) || r.nama.toLowerCase().includes(term));
  }, [all, search]);

  if (!state) return <PageSkeleton />;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSave(nilai: Record<string, unknown>) {
    if (!state || !editing) return;
    setAppState(updatePenilaian(state, editing.mahasiswaId, nilai));
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Data Penilaian</h1>
          <p className="page-subtitle">Nilai C1&ndash;C5 setiap mahasiswa sebagai input TOPSIS.</p>
        </div>
        <ImportButton />
      </div>

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
          className="input pl-10 shadow-card"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="table-head">
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
                <tr key={r.mahasiswaId} className="table-row">
                  <td className="px-4 py-3 font-mono text-slate-600">{r.altCode}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-700">{r.nim}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.nama}</td>
                  {KRITERIA_KODE.map((k) => (
                    <td key={k} className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                      {r.nilai[k] !== undefined ? formatNilai(r.nilai[k]) : <span className="text-amber-600">&ndash;</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(r)}
                        aria-label={`Edit nilai ${r.nama}`}
                        title="Edit nilai"
                        className="btn-icon"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/penilaian/detail?id=${r.mahasiswaId}`}
                        aria-label={`Lihat detail ${r.nama}`}
                        title="Detail"
                        className="btn-icon"
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

      <Pagination
        shown={pageRows.length}
        total={filtered.length}
        page={currentPage}
        totalPages={totalPages}
        onPrev={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />

      {editing && <PenilaianFormModal row={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
    </div>
  );
}

function PenilaianFormModal({
  row,
  onClose,
  onSave,
}: {
  row: PenilaianRow;
  onClose: () => void;
  onSave: (nilai: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const k of KRITERIA_KODE) initial[k] = row.nilai[k] != null ? String(row.nilai[k]) : '';
    return initial;
  });
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (const k of KRITERIA_KODE) {
      if (values[k].trim() === '') {
        setError(`Nilai ${k} (${KRITERIA_LABEL[k]}) wajib diisi`);
        return;
      }
    }
    try {
      onSave(values);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="modal-panel"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-extrabold text-ink">
            Edit Nilai &middot; {row.altCode} {row.nama}
          </h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="btn-icon -mr-2 -mt-1">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {KRITERIA_KODE.map((k) => (
            <div key={k}>
              <label className="label">
                {k} <span className="font-normal text-muted">({KRITERIA_LABEL[k]})</span>
              </label>
              <input
                value={values[k]}
                onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                inputMode="decimal"
                className="input mt-1.5 font-mono"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            Simpan
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
