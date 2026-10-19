'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Mahasiswa } from '@/lib/types';

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

  async function handleDelete(id: number) {
    if (!confirm('Hapus mahasiswa ini? Semua nilai terkait juga akan terhapus.')) return;
    const res = await fetch(`/api/mahasiswa/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Gagal menghapus mahasiswa');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Mahasiswa</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Tambah Mahasiswa
        </button>
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
              <th className="px-4 py-2">Program Studi</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{m.altCode}</td>
                <td className="px-4 py-2">{m.nim}</td>
                <td className="px-4 py-2">{m.nama}</td>
                <td className="px-4 py-2">{m.programStudi}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditing(m);
                      setShowForm(true);
                    }}
                    className="text-slate-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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
    const url = mahasiswa ? `/api/mahasiswa/${mahasiswa.id}` : '/api/mahasiswa';
    const method = mahasiswa ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, nama, angkatan: angkatan || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      onError(body.error ?? 'Gagal menyimpan data');
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">{mahasiswa ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">NIM</label>
          <input value={nim} onChange={(e) => setNim(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Angkatan</label>
          <input value={angkatan ?? ''} onChange={(e) => setAngkatan(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
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
