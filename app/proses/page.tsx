'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAppState, setAppState } from '@/lib/useAppState';
import { runProses } from '@/lib/store';
import { IconPlay, IconCheckCircle, IconAlertTriangle, IconTrophy, IconChevronRight } from '@/components/icons';

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
      setError((err as Error).message || 'Proses PROMETHEE gagal');
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Proses PROMETHEE</h1>
        <p className="mt-1 text-sm text-muted">Hitung leaving flow, entering flow, dan net flow untuk seluruh mahasiswa.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <ol className="space-y-1">
          {TAHAPAN.map((t, i) => {
            const stepState = completed ? 'done' : i < activeStep ? 'done' : i === activeStep && running ? 'active' : 'pending';
            return (
              <li key={t} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-200">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ${
                    stepState === 'done'
                      ? 'bg-emerald-600 text-white'
                      : stepState === 'active'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted-bg text-slate-400'
                  }`}
                >
                  {stepState === 'done' ? <IconCheckCircle className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`text-sm transition-colors duration-200 ${stepState === 'pending' ? 'text-muted' : 'text-slate-800'}`}>{t}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Proses selesai untuk <span className="font-semibold">{result.alternatifCount}</span> alternatif dalam{' '}
            <span className="font-mono">{result.durationMs} ms</span>. Diproses pada{' '}
            <span className="font-mono">{new Date(result.processedAt).toLocaleString('id-ID')}</span>.
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRun}
          disabled={running || !state}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <IconPlay className="h-4 w-4" />
          {running ? 'Memproses...' : 'Jalankan Proses'}
        </button>
        {result && (
          <Link
            href="/ranking"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-muted-bg"
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
