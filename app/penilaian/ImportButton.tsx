'use client';

import { useRef, useState } from 'react';
import { useAppState, setAppState } from '@/lib/useAppState';
import { importMatriks } from '@/lib/store';
import { IconUpload, IconCheckCircle } from '@/components/icons';

export function ImportButton() {
  const state = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !state) return;
    setImporting(true);
    setStatus(null);
    setError(null);

    try {
      const { parseMatriksKeputusanBuffer } = await import('@/lib/excel');
      const rows = await parseMatriksKeputusanBuffer(await file.arrayBuffer());
      const result = importMatriks(state, rows);
      setAppState(result.state);
      setStatus(`Impor selesai: ${result.created} data baru, ${result.updated} data diperbarui.`);
    } catch (err) {
      setError((err as Error).message || 'Gagal mengimpor file');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-muted-bg ${
          importing || !state ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <IconUpload className="h-4 w-4" />
        {importing ? 'Mengimpor...' : 'Import Excel'}
        <input ref={inputRef} type="file" accept=".xlsx" onChange={handleChange} className="hidden" disabled={importing || !state} />
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
