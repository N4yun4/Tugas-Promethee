'use client';

import { useRef, useState } from 'react';

export function ImportButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Mengimpor...');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/penilaian/import', { method: 'POST', body: formData });
    const body = await res.json();

    if (!res.ok) {
      setStatus(null);
      setError(body.error ?? 'Gagal mengimpor file');
      return;
    }

    setStatus(`Impor selesai: ${body.created} data baru, ${body.updated} data diperbarui.`);
    if (inputRef.current) inputRef.current.value = '';
    onImported();
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Import Excel
        <input ref={inputRef} type="file" accept=".xlsx" onChange={handleChange} className="hidden" />
      </label>
      {status && <span className="text-sm text-green-700">{status}</span>}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
