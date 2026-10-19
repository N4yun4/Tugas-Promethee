'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Kriteria } from '@/lib/types';

export function KriteriaManager({ initialData }: { initialData: Kriteria[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Kriteria | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Data Kriteria</h1>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Kode</th>
              <th className="px-4 py-2">Kriteria</th>
              <th className="px-4 py-2">Jenis</th>
              <th className="px-4 py-2">Bobot</th>
              <th className="px-4 py-2">Fungsi Preferensi</th>
              <th className="px-4 py-2">Parameter p</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((k) => (
              <tr key={k.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{k.kode}</td>
                <td className="px-4 py-2">{k.nama}</td>
                <td className="px-4 py-2 capitalize">{k.jenis}</td>
                <td className="px-4 py-2 font-mono">{k.bobot.toFixed(6)}</td>
                <td className="px-4 py-2 capitalize">{k.preferenceFunction}</td>
                <td className="px-4 py-2 font-mono">{k.parameterP ?? '-'}</td>
                <td className="px-4 py-2">
                  <button onClick={() => setEditing(k)} className="text-slate-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <KriteriaFormModal
          kriteria={editing}
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

function KriteriaFormModal({
  kriteria,
  onClose,
  onSaved,
  onError,
}: {
  kriteria: Kriteria;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [bobot, setBobot] = useState(String(kriteria.bobot));
  const [jenis, setJenis] = useState(kriteria.jenis);
  const [preferenceFunction, setPreferenceFunction] = useState(kriteria.preferenceFunction);
  const [parameterP, setParameterP] = useState(kriteria.parameterP != null ? String(kriteria.parameterP) : '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/kriteria/${kriteria.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: kriteria.nama,
        jenis,
        bobot: Number(bobot),
        preferenceFunction,
        parameterP: preferenceFunction === 'linear' ? Number(parameterP) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      onError(body.error ?? 'Gagal menyimpan kriteria');
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">
          Edit {kriteria.kode} - {kriteria.nama}
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Jenis</label>
          <select value={jenis} onChange={(e) => setJenis(e.target.value as 'benefit' | 'cost')} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="benefit">Benefit</option>
            <option value="cost">Cost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Bobot</label>
          <input value={bobot} onChange={(e) => setBobot(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fungsi Preferensi</label>
          <select
            value={preferenceFunction}
            onChange={(e) => setPreferenceFunction(e.target.value as 'usual' | 'linear')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="usual">Tipe I - Usual</option>
            <option value="linear">Tipe III - Linear</option>
          </select>
        </div>
        {preferenceFunction === 'linear' && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Parameter p</label>
            <input value={parameterP} onChange={(e) => setParameterP(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono" />
          </div>
        )}
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
