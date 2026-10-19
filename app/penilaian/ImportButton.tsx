'use client';

import { useRef, useState } from 'react';
import { IconUpload, IconCheckCircle } from '@/components/icons';

export function ImportButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setStatus(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/penilaian/import', { method: 'POST', body: formData });
      const body = await res.json().catch(() => ({ error: 'Server mengembalikan respons yang tidak valid' }));

      if (!res.ok) {
        setError(body.error ?? 'Gagal mengimpor file');
        return;
      }

      setStatus(`Impor selesai: ${body.created} data baru, ${body.updated} data diperbarui.`);
      if (inputRef.current) inputRef.current.value = '';
      onImported();
    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-muted-bg ${
          importing ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <IconUpload className="h-4 w-4" />
        {importing ? 'Mengimpor...' : 'Import Excel'}
        <input ref={inputRef} type="file" accept=".xlsx" onChange={handleChange} className="hidden" disabled={importing} />
      </label>
      {status && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-700">
          <IconCheckCircle className="h-3.5 w-3.5" />
          {status}
        </span>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
