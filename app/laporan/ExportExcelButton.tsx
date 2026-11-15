'use client';

import { useState } from 'react';
import { useAppState } from '@/lib/useAppState';
import { getRankingRows } from '@/lib/store';
import { IconDownload } from '@/components/icons';

export function ExportExcelButton() {
  const state = useAppState();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (!state) return;
    setError(null);
    const rows = getRankingRows(state);
    if (rows.length === 0) {
      setError('Belum ada hasil ranking. Jalankan Proses PROMETHEE terlebih dahulu.');
      return;
    }
    setBusy(true);
    try {
      const { generateRankingExcel } = await import('@/lib/excel');
      const bytes = await generateRankingExcel(rows);
      const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Ranking_PROMETHEE.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message || 'Gagal membuat file Excel');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleExport}
        disabled={busy || !state}
        className="btn-secondary"
      >
        <IconDownload className="h-4 w-4" />
        {busy ? 'Membuat file...' : 'Export Excel'}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
