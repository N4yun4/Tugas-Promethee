'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAppState, setAppState } from '@/lib/useAppState';
import { runProses } from '@/lib/store';
import { IconPlay, IconCheckCircle, IconAlertTriangle, IconTrophy, IconChevronRight } from '@/components/icons';

const TAHAPAN = [
  'Pemeriksaan data mahasiswa dan kriteria',
  'Matriks keputusan (X)',
  'Normalisasi matriks (R)',
  'Normalisasi terbobot (Y)',
  'Solusi ideal positif (A+) dan negatif (A−)',
  'Jarak ke solusi ideal (D+ dan D−)',
  'Nilai preferensi (V)',
  'Perankingan',
];

const MIN_VISIBLE_MS = TAHAPAN.length * 180;

export default function ProsesPage() {
  const state = useAppState();
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<{ alternatifCount: number; durationMs: number; processedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current);
    };
  }, []);

  async function handleRun() {
    if (!state) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setActiveStep(1);

    // The computation finishes in milliseconds; the stage indicators are
    // staggered so the user can follow the tahapan, not as literal progress.
    stepTimer.current = setInterval(() => {
      setActiveStep((s) => (s < TAHAPAN.length - 1 ? s + 1 : s));
    }, 180);

    try {
      const outcome = runProses(state, new Date());
      await new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS));
      setAppState(outcome.state);
      setActiveStep(TAHAPAN.length);
      setResult({ alternatifCount: outcome.alternatifCount, durationMs: outcome.durationMs, processedAt: outcome.processedAt });
    } catch (err) {
      setError((err as Error).message || 'Proses TOPSIS gagal');
      setActiveStep(0);
    } finally {
      if (stepTimer.current) clearInterval(stepTimer.current);
      setRunning(false);
    }
  }

  const completed = activeStep >= TAHAPAN.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Proses TOPSIS</h1>
        <p className="page-subtitle">Hitung jarak ke solusi ideal positif dan negatif serta nilai preferensi seluruh mahasiswa.</p>
      </div>

      <div className="card p-5">
        <ol className="grid gap-1 sm:grid-cols-2">
          {TAHAPAN.map((t, i) => {
            const stepState = completed ? 'done' : i < activeStep ? 'done' : i === activeStep && running ? 'active' : 'pending';
            return (
              <li
                key={t}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 ${stepState === 'active' ? 'bg-primary/5' : ''}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200 ${
                    stepState === 'done'
                      ? 'bg-emerald-500 text-white'
                      : stepState === 'active'
                        ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-glow'
                        : 'bg-primary/10 text-primary'
                  }`}
                >
                  {stepState === 'done' ? <IconCheckCircle className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`text-sm font-semibold transition-colors duration-200 ${stepState === 'pending' ? 'text-muted' : 'text-ink'}`}>{t}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {error && (
        <div className="alert-error flex items-start gap-2" role="alert">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Proses selesai untuk <span className="font-semibold">{result.alternatifCount}</span> alternatif dalam{' '}
            <span className="font-mono">{result.durationMs} ms</span>. Diproses pada{' '}
            <span className="font-mono">{new Date(result.processedAt).toLocaleString('id-ID')}</span>.
          </span>
        </div>
      )}

      {state?.solusiIdeal && (
        <div className="card overflow-hidden">
          <div className="px-5 pt-4">
            <p className="text-sm font-bold text-ink">Solusi Ideal (proses terakhir)</p>
            <p className="mt-0.5 text-xs text-muted">
              Nilai pada matriks ternormalisasi terbobot. Benefit: A+ = maks, A− = min. Cost: A+ = min, A− = maks.
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-2.5">Solusi</th>
                  {[...state.kriteria]
                    .sort((a, b) => a.kode.localeCompare(b.kode))
                    .map((k) => (
                      <th key={k.kode} className="px-4 py-2.5 text-right">
                        {k.kode} <span className="font-normal capitalize text-muted">({k.jenis})</span>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(['positif', 'negatif'] as const).map((jenis) => (
                  <tr key={jenis} className="table-row">
                    <td className="px-4 py-2.5 font-semibold text-ink">{jenis === 'positif' ? 'A+ (ideal positif)' : 'A− (ideal negatif)'}</td>
                    {[...state.kriteria]
                    .sort((a, b) => a.kode.localeCompare(b.kode))
                      .map((k) => (
                        <td key={k.kode} className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700">
                          {state.solusiIdeal![jenis][k.kode]?.toFixed(6) ?? '-'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRun}
          disabled={running || !state}
          className="btn-primary"
        >
          <IconPlay className="h-4 w-4" />
          {running ? 'Memproses...' : 'Jalankan Proses'}
        </button>
        {result && (
          <Link
            href="/ranking"
            className="btn-secondary"
          >
            <IconTrophy className="h-4 w-4" />
            Lihat Hasil Ranking
            <IconChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
