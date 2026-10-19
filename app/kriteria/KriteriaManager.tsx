'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Kriteria } from '@/lib/types';
import { IconPencil, IconX } from '@/components/icons';

export function KriteriaManager({ initialData }: { initialData: Kriteria[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Kriteria | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Data Kriteria</h1>
        <p className="mt-1 text-sm text-muted">Bobot dan fungsi preferensi lima kriteria penilaian PROMETHEE.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 rounded p-1 hover:bg-red-100" aria-label="Tutup pesan error">
            <IconX className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted-bg text-xs font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Kriteria</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Bobot</th>
                <th className="px-4 py-3">Fungsi Preferensi</th>
                <th className="px-4 py-3">Parameter p</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialData.map((k) => (
                <tr key={k.id} className="transition-colors hover:bg-muted-bg/60">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">{k.kode}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{k.nama}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        k.jenis === 'benefit' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {k.jenis === 'benefit' ? 'Benefit' : 'Cost'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-700">{k.bobot.toFixed(6)}</td>
                  <td className="px-4 py-3 text-slate-600">{k.preferenceFunction === 'linear' ? 'Tipe III - Linear' : 'Tipe I - Usual'}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-slate-700">{k.parameterP ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(k)}
                      aria-label={`Edit kriteria ${k.kode}`}
                      title="Edit"
                      className="rounded-md p-2 text-slate-500 transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <IconPencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    try {
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
      const body = await res.json().catch(() => ({ error: 'Gagal menyimpan kriteria' }));
      if (!res.ok) {
        onError(body.error ?? 'Gagal menyimpan kriteria');
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
            Edit {kriteria.kode} &middot; {kriteria.nama}
          </h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-md p-1 text-muted hover:bg-muted-bg hover:text-slate-900">
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Jenis</label>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as 'benefit' | 'cost')}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm transition-colors focus:border-primary"
          >
            <option value="benefit">Benefit</option>
            <option value="cost">Cost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Bobot</label>
          <input
            value={bobot}
            onChange={(e) => setBobot(e.target.value)}
            inputMode="decimal"
            className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-mono text-sm transition-colors focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fungsi Preferensi</label>
          <select
            value={preferenceFunction}
            onChange={(e) => setPreferenceFunction(e.target.value as 'usual' | 'linear')}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm transition-colors focus:border-primary"
          >
            <option value="usual">Tipe I - Usual</option>
            <option value="linear">Tipe III - Linear</option>
          </select>
        </div>
        {preferenceFunction === 'linear' && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Parameter p</label>
            <input
              value={parameterP}
              onChange={(e) => setParameterP(e.target.value)}
              inputMode="decimal"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 font-mono text-sm transition-colors focus:border-primary"
            />
            <p className="mt-1.5 text-xs text-muted">Harus berupa angka positif.</p>
          </div>
        )}
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
