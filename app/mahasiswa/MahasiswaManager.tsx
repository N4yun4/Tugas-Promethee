'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Mahasiswa } from '@/lib/types';
import { IconSearch, IconPlus, IconPencil, IconTrash, IconChevronLeft, IconChevronRight, IconUsers, IconX } from '@/components/icons';

const PAGE_SIZE = 20;

export function MahasiswaManager({ initialData }: { initialData: Mahasiswa[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Mahasiswa | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialData;
    return initialData.filter((m) => m.nim.toLowerCase().includes(term) || m.nama.toLowerCase().includes(term));
  }, [initialData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(m: Mahasiswa) {
    if (!confirm(`Hapus ${m.nama} (${m.nim})? Semua nilai terkait juga akan terhapus.`)) return;
    const res = await fetch(`/api/mahasiswa/${m.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Gagal menghapus mahasiswa' }));
      setError(body.error ?? 'Gagal menghapus mahasiswa');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Data Mahasiswa</h1>
          <p className="mt-1 text-sm text-muted">Kelola alternatif yang diproses dalam PROMETHEE II.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <IconPlus className="h-4 w-4" />
          Tambah Mahasiswa
        </button>
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
                <th className="px-4 py-3">Program Studi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-muted-bg/60">
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
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <IconPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        aria-label={`Hapus ${m.nama}`}
                        title="Hapus"
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-destructive"
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

      {showForm && (
        <MahasiswaFormModal
          mahasiswa={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            router.refresh();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function MahasiswaFormModal({
  mahasiswa,
  onClose,
  onSaved,
  onError,
}: {
  mahasiswa: Mahasiswa | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [nim, setNim] = useState(mahasiswa?.nim ?? '');
  const [nama, setNama] = useState(mahasiswa?.nama ?? '');
  const [angkatan, setAngkatan] = useState(mahasiswa?.angkatan ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nim.trim() || !nama.trim()) {
      onError('NIM dan nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const url = mahasiswa ? `/api/mahasiswa/${mahasiswa.id}` : '/api/mahasiswa';
      const method = mahasiswa ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nim, nama, angkatan: angkatan || null, programStudi: mahasiswa?.programStudi }),
      });
      const body = await res.json().catch(() => ({ error: 'Gagal menyimpan data' }));
      if (!res.ok) {
        onError(body.error ?? 'Gagal menyimpan data');
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
          <h2 className="text-lg font-semibold text-slate-900">{mahasiswa ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md p-1 text-muted hover:bg-muted-bg hover:text-slate-900">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">NIM</label>
          <input
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm transition-colors focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama</label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm transition-colors focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Angkatan</label>
          <input
            value={angkatan ?? ''}
            onChange={(e) => setAngkatan(e.target.value)}
            placeholder="Opsional"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm transition-colors focus:border-primary placeholder:text-slate-400"
          />
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
