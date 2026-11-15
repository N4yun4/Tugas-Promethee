import { runPromethee, type Alternatif, type Kriteria as EngineKriteria } from './promethee';
import type { Mahasiswa, Kriteria, PenilaianRow } from './types';
import type { MatriksRow } from './excel';

export const KRITERIA_KODE = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;
const DEFAULT_PROGRAM_STUDI = 'Teknologi Rekayasa Komputer';

export interface HasilRanking {
  mahasiswaId: number;
  leavingFlow: number;
  enteringFlow: number;
  netFlow: number;
  ranking: number;
}

export interface RankingRow extends HasilRanking {
  altCode: string;
  nim: string;
  nama: string;
}

export interface AppState {
  version: 1;
  nextMahasiswaId: number;
  mahasiswa: Mahasiswa[];
  kriteria: Kriteria[];
  penilaian: Record<number, Record<string, number>>;
  hasilRanking: HasilRanking[];
  processedAt: string | null;
}

export class StoreError extends Error {}

function altNumber(altCode: string): number {
  const n = Number.parseInt(altCode.slice(1), 10);
  return Number.isNaN(n) ? 0 : n;
}

function nextAltCode(mahasiswa: Mahasiswa[]): string {
  return `A${mahasiswa.reduce((max, m) => Math.max(max, altNumber(m.altCode)), 0) + 1}`;
}

function findMahasiswa(state: AppState, id: number): Mahasiswa {
  const found = state.mahasiswa.find((m) => m.id === id);
  if (!found) throw new StoreError('Mahasiswa tidak ditemukan');
  return found;
}

export interface MahasiswaInput {
  nim: string;
  nama: string;
  angkatan?: string | null;
  programStudi?: string;
}

export function createMahasiswa(state: AppState, input: MahasiswaInput): { state: AppState; mahasiswa: Mahasiswa } {
  const nim = input.nim.trim();
  const nama = input.nama.trim();
  if (!nim || !nama) throw new StoreError('NIM dan nama wajib diisi');
  if (state.mahasiswa.some((m) => m.nim === nim)) throw new StoreError(`NIM ${nim} sudah terdaftar`);

  const mahasiswa: Mahasiswa = {
    id: state.nextMahasiswaId,
    altCode: nextAltCode(state.mahasiswa),
    nim,
    nama,
    programStudi: input.programStudi || DEFAULT_PROGRAM_STUDI,
    angkatan: input.angkatan || null,
  };
  return {
    state: { ...state, nextMahasiswaId: state.nextMahasiswaId + 1, mahasiswa: [...state.mahasiswa, mahasiswa] },
    mahasiswa,
  };
}

export function updateMahasiswa(state: AppState, id: number, input: MahasiswaInput): AppState {
  const existing = findMahasiswa(state, id);
  const nim = input.nim.trim();
  const nama = input.nama.trim();
  if (!nim || !nama) throw new StoreError('NIM dan nama wajib diisi');
  if (state.mahasiswa.some((m) => m.nim === nim && m.id !== id)) {
    throw new StoreError(`NIM ${nim} sudah dipakai mahasiswa lain`);
  }
  const updated: Mahasiswa = {
    ...existing,
    nim,
    nama,
    programStudi: input.programStudi || existing.programStudi,
    angkatan: input.angkatan === undefined ? existing.angkatan : input.angkatan || null,
  };
  return { ...state, mahasiswa: state.mahasiswa.map((m) => (m.id === id ? updated : m)) };
}

export function deleteMahasiswa(state: AppState, id: number): AppState {
  findMahasiswa(state, id);
  const penilaian = { ...state.penilaian };
  delete penilaian[id];
  return {
    ...state,
    mahasiswa: state.mahasiswa.filter((m) => m.id !== id),
    penilaian,
    hasilRanking: state.hasilRanking.filter((h) => h.mahasiswaId !== id),
  };
}

export interface KriteriaInput {
  nama?: string;
  jenis: 'benefit' | 'cost';
  bobot: number;
  preferenceFunction: 'usual' | 'linear';
  parameterP: number | null;
}

export function updateKriteria(state: AppState, id: number, input: KriteriaInput): AppState {
  const existing = state.kriteria.find((k) => k.id === id);
  if (!existing) throw new StoreError('Kriteria tidak ditemukan');
  if (input.jenis !== 'benefit' && input.jenis !== 'cost') {
    throw new StoreError("Jenis harus 'benefit' atau 'cost'");
  }
  if (input.preferenceFunction !== 'usual' && input.preferenceFunction !== 'linear') {
    throw new StoreError("Preference function harus 'usual' atau 'linear'");
  }
  if (input.preferenceFunction === 'linear' && (typeof input.parameterP !== 'number' || !(input.parameterP > 0))) {
    throw new StoreError('Parameter p wajib diisi dengan angka positif untuk fungsi Linear');
  }
  if (typeof input.bobot !== 'number' || !(input.bobot > 0)) {
    throw new StoreError('Bobot harus berupa angka positif');
  }
  const updated: Kriteria = {
    ...existing,
    nama: input.nama || existing.nama,
    jenis: input.jenis,
    bobot: input.bobot,
    preferenceFunction: input.preferenceFunction,
    parameterP: input.preferenceFunction === 'usual' ? null : input.parameterP,
  };
  return { ...state, kriteria: state.kriteria.map((k) => (k.id === id ? updated : k)) };
}

function parseNilai(kode: string, raw: unknown): number {
  if (raw === null || raw === undefined || typeof raw === 'boolean' || (typeof raw === 'string' && raw.trim() === '')) {
    throw new StoreError(`Nilai ${kode} harus berupa angka`);
  }
  const nilai = Number(raw);
  if (!Number.isFinite(nilai)) throw new StoreError(`Nilai ${kode} harus berupa angka`);
  return nilai;
}

export function updatePenilaian(state: AppState, mahasiswaId: number, nilaiInput: Record<string, unknown>): AppState {
  findMahasiswa(state, mahasiswaId);
  const kodeSet = new Set(state.kriteria.map((k) => k.kode));
  const parsed: Record<string, number> = {};
  for (const kode of Object.keys(nilaiInput)) {
    if (!kodeSet.has(kode)) throw new StoreError(`Kriteria ${kode} tidak dikenal`);
    parsed[kode] = parseNilai(kode, nilaiInput[kode]);
  }
  return {
    ...state,
    penilaian: { ...state.penilaian, [mahasiswaId]: { ...state.penilaian[mahasiswaId], ...parsed } },
  };
}

export function importMatriks(state: AppState, rows: MatriksRow[]): { state: AppState; created: number; updated: number } {
  let next = state;
  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const existing = next.mahasiswa.find((m) => m.nim === row.nim);
    let id: number;
    if (existing) {
      id = existing.id;
      updated += 1;
    } else {
      // The file's alt code may already belong to a different NIM (e.g. after a
      // delete or when importing another dataset); fall back to the next free one.
      const altCode = next.mahasiswa.some((m) => m.altCode === row.altCode) ? nextAltCode(next.mahasiswa) : row.altCode;
      const mahasiswa: Mahasiswa = {
        id: next.nextMahasiswaId,
        altCode,
        nim: row.nim,
        nama: row.nama,
        programStudi: DEFAULT_PROGRAM_STUDI,
        angkatan: null,
      };
      next = { ...next, nextMahasiswaId: next.nextMahasiswaId + 1, mahasiswa: [...next.mahasiswa, mahasiswa] };
      id = mahasiswa.id;
      created += 1;
    }
    next = updatePenilaian(next, id, { C1: row.c1, C2: row.c2, C3: row.c3, C4: row.c4, C5: row.c5 });
  }
  return { state: next, created, updated };
}

export function runProses(
  state: AppState,
  now: Date
): { state: AppState; alternatifCount: number; durationMs: number; processedAt: string } {
  if (state.mahasiswa.length === 0) throw new StoreError('Tidak ada data mahasiswa untuk diproses');
  if (state.kriteria.length === 0) throw new StoreError('Tidak ada data kriteria untuk diproses');

  const engineKriteria: EngineKriteria[] = state.kriteria.map((k) => ({
    kode: k.kode,
    jenis: k.jenis,
    bobot: k.bobot,
    preferenceFunction: k.preferenceFunction,
    parameterP: k.parameterP,
  }));

  const alternatifList: Alternatif[] = state.mahasiswa.map((m) => {
    const nilai = state.penilaian[m.id];
    if (!nilai || engineKriteria.some((k) => nilai[k.kode] === undefined)) {
      throw new StoreError(`${m.altCode} (NIM ${m.nim}, ${m.nama}) belum memiliki nilai lengkap untuk semua kriteria`);
    }
    return { id: String(m.id), nilai };
  });

  const start = Date.now();
  const result = runPromethee(alternatifList, engineKriteria);
  const durationMs = Date.now() - start;
  const processedAt = now.toISOString();

  const hasilRanking: HasilRanking[] = result.map((r) => ({
    mahasiswaId: Number(r.id),
    leavingFlow: r.leavingFlow,
    enteringFlow: r.enteringFlow,
    netFlow: r.netFlow,
    ranking: r.ranking,
  }));

  return { state: { ...state, hasilRanking, processedAt }, alternatifCount: alternatifList.length, durationMs, processedAt };
}

export function getMahasiswaSorted(state: AppState): Mahasiswa[] {
  return [...state.mahasiswa].sort((a, b) => altNumber(a.altCode) - altNumber(b.altCode));
}

export function getPenilaianRows(state: AppState): PenilaianRow[] {
  return getMahasiswaSorted(state).map((m) => ({
    mahasiswaId: m.id,
    altCode: m.altCode,
    nim: m.nim,
    nama: m.nama,
    nilai: state.penilaian[m.id] ?? {},
  }));
}

export function getRankingRows(state: AppState): RankingRow[] {
  const byId = new Map(state.mahasiswa.map((m) => [m.id, m]));
  const rows: RankingRow[] = [];
  for (const h of state.hasilRanking) {
    const m = byId.get(h.mahasiswaId);
    if (m) rows.push({ ...h, altCode: m.altCode, nim: m.nim, nama: m.nama });
  }
  return rows.sort((a, b) => a.ranking - b.ranking || (a.altCode < b.altCode ? -1 : a.altCode > b.altCode ? 1 : 0));
}
