'use client';

import { useSyncExternalStore } from 'react';
import type { AppState } from './store';
import { createSeedState } from './seed';

const STORAGE_KEY = 'spk-promethee-state-v1';

let current: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.mahasiswa)) return parsed;
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
