'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TAHAPAN = [
  'Pemeriksaan data mahasiswa',
  'Pemeriksaan data kriteria',
  'Bobot kriteria',
  'Preference Function',
  'Preference Index',
  'Leaving Flow',
  'Entering Flow',
  'Net Flow',
];

export default function ProsesPage() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ alternatifCount: number; durationMs: number; processedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/proses', { method: 'POST' });
      const body = await res.json().catch(() => ({ error: 'Server mengembalikan respons yang tidak valid' }));
      if (!res.ok) {
        setError(body.error ?? 'Proses PROMETHEE gagal');
        return;
      }
      setResult(body);
      router.refresh();
    } catch {
      setError('Gagal menghubungi server. Coba lagi.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Proses PROMETHEE</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <ol className="space-y-2 text-sm text-slate-600">
          {TAHAPAN.map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
                  result ? 'bg-green-600' : running ? 'bg-slate-400' : 'bg-slate-300'
                }`}
              >
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Proses selesai untuk {result.alternatifCount} alternatif dalam {result.durationMs} ms. Diproses pada{' '}
          {new Date(result.processedAt).toLocaleString('id-ID')}.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRun}
          disabled={running}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {running ? 'Memproses...' : 'Jalankan Proses'}
        </button>
        {result && (
          <a href="/ranking" className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Lihat Hasil Ranking
          </a>
        )}
      </div>
    </div>
  );
}
