'use client';

import { useMemo, useState } from 'react';
import type { Mahasiswa } from '@/lib/types';
import { useAppState, setAppState } from '@/lib/useAppState';
import { createMahasiswa, updateMahasiswa, deleteMahasiswa, getMahasiswaSorted, type MahasiswaInput } from '@/lib/store';
import { PageSkeleton } from '@/components/PageSkeleton';
import { ModalBackdrop } from '@/components/ModalBackdrop';
import { Pagination } from '@/components/Pagination';
import { IconSearch, IconPlus, IconPencil, IconTrash, IconUsers, IconX } from '@/components/icons';

const PAGE_SIZE = 20;

export function MahasiswaManager() {
  const state = useAppState();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Mahasiswa | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const all = useMemo(() => (state ? getMahasiswaSorted(state) : []), [state]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((m) => m.nim.toLowerCase().includes(term) || m.nama.toLowerCase().includes(term));
  }, [all, search]);

  if (!state) return <PageSkeleton />;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleDelete(m: Mahasiswa) {
    if (!state || !confirm(`Hapus ${m.nama} (${m.nim})? Semua nilai terkait juga akan terhapus.`)) return;
    try {
      setAppState(deleteMahasiswa(state, m.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function handleSave(input: MahasiswaInput) {
    if (!state) return;
    const next = editing ? updateMahasiswa(state, editing.id, input) : createMahasiswa(state, input).state;
    setAppState(next);
    setShowForm(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Data Mahasiswa</h1>
          <p className="page-subtitle">Kelola alternatif yang diproses dalam PROMETHEE II.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="btn-primary"
        >
          <IconPlus className="h-4 w-4" />
          Tambah Mahasiswa
        </button>
      </div>

      {error && (
        <div className="alert-error flex items-center justify-between gap-3">
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
                <th className="px-4 py-3">Program Studi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((m) => (
                <tr key={m.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-slate-600">{m.altCode}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-700">{m.nim}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.nama}</td>
                  <td className="px-4 py-3 text-slate-600">{m.programStudi}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(m);
                          setShowForm(true);
                        }}
                        aria-label={`Edit ${m.nama}`}
                        title="Edit"
                        className="btn-icon"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        aria-label={`Hapus ${m.nama}`}
                        title="Hapus"
                        className="btn-icon-danger"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-center text-muted">
                      <IconUsers className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">Tidak ada data mahasiswa yang cocok.</p>
                    </div>
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

      {showForm && <MahasiswaFormModal mahasiswa={editing} onClose={() => setShowForm(false)} onSave={handleSave} />}
    </div>
  );
}

function MahasiswaFormModal({
  mahasiswa,
  onClose,
  onSave,
}: {
  mahasiswa: Mahasiswa | null;
  onClose: () => void;
  onSave: (input: MahasiswaInput) => void;
}) {
  const [nim, setNim] = useState(mahasiswa?.nim ?? '');
  const [nama, setNama] = useState(mahasiswa?.nama ?? '');
  const [angkatan, setAngkatan] = useState(mahasiswa?.angkatan ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      onSave({ nim, nama, angkatan: angkatan || null });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="modal-panel">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-extrabold text-ink">{mahasiswa ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="btn-icon -mr-2 -mt-1">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="mhs-nim" className="label">
            NIM
          </label>
          <input
            id="mhs-nim"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            className="input mt-1.5"
          />
        </div>
        <div>
          <label htmlFor="mhs-nama" className="label">
            Nama
          </label>
          <input
            id="mhs-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="input mt-1.5"
          />
        </div>
        <div>
          <label htmlFor="mhs-angkatan" className="label">
            Angkatan
          </label>
          <input
            id="mhs-angkatan"
            value={angkatan ?? ''}
            onChange={(e) => setAngkatan(e.target.value)}
            placeholder="Opsional"
            className="input mt-1.5"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Simpan
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}
