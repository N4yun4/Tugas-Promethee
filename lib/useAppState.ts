'use client';

import { useSyncExternalStore } from 'react';
import type { AppState } from './store';
import { createSeedState } from './seed';

const STORAGE_KEY = 'spk-topsis-state-v1';
// Data dari versi PROMETHEE sebelumnya: mahasiswa, bobot, dan nilai tetap dipakai,
// sedangkan hasil ranking lama dibuang karena dihitung dengan metode lain.
const LEGACY_STORAGE_KEY = 'spk-promethee-state-v1';

function migrateLegacy(raw: string): AppState | null {
  const old = JSON.parse(raw);
  if (!old || old.version !== 1 || !Array.isArray(old.mahasiswa) || !Array.isArray(old.kriteria)) return null;
  return {
    version: 2,
    nextMahasiswaId: old.nextMahasiswaId,
    mahasiswa: old.mahasiswa,
    kriteria: old.kriteria.map(({ id, kode, nama, jenis, bobot }: AppState['kriteria'][number]) => ({ id, kode, nama, jenis, bobot })),
    penilaian: old.penilaian ?? {},
    hasilRanking: [],
    solusiIdeal: null,
    processedAt: null,
  };
}

let current: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === 2 && Array.isArray(parsed.mahasiswa)) return parsed;
    }
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = migrateLegacy(legacy);
      if (migrated) return migrated;
    }
  } catch {
    // Storage blocked (private mode) or corrupted JSON: fall back to the bundled seed data.
  }
  return createSeedState();
}

function getSnapshot(): AppState {
  if (!current) current = load();
  return current;
}

function getServerSnapshot(): AppState | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAppState(next: AppState) {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep working in memory if the browser refuses to persist.
  }
  listeners.forEach((listener) => listener());
}

export function resetAppState() {
  setAppState(createSeedState());
}

/** Returns null during prerender/hydration, then the browser-persisted state. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
