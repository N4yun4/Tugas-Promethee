import { describe, it, expect } from 'vitest';
import path from 'path';
import ExcelJS from 'exceljs';
import {
  createMahasiswa,
  updateMahasiswa,
  deleteMahasiswa,
  updateKriteria,
  updatePenilaian,
  importMatriks,
  runProses,
  getPenilaianRows,
  getRankingRows,
  getMahasiswaSorted,
  StoreError,
  type AppState,
} from './store';
import { createSeedState } from './seed';
import { DEFAULT_KRITERIA } from './defaultKriteria';

function emptyState(): AppState {
  return {
    version: 1,
    nextMahasiswaId: 1,
    mahasiswa: [],
    kriteria: DEFAULT_KRITERIA.map((k, i) => ({ id: i + 1, nama: k.kode, ...k })),
    penilaian: {},
    hasilRanking: [],
    processedAt: null,
  };
}

function withStudents(...students: { nim: string; nama: string; nilai?: Record<string, number> }[]): AppState {
  let state = emptyState();
  for (const s of students) {
    const created = createMahasiswa(state, { nim: s.nim, nama: s.nama });
    state = created.state;
    if (s.nilai) state = updatePenilaian(state, created.mahasiswa.id, s.nilai);
  }
  return state;
}

const FULL = { C1: 90, C2: 0, C3: 0, C4: 0, C5: 3.5 };

describe('seed state', () => {
  it('contains 254 mahasiswa, 5 kriteria, and full nilai for everyone', () => {
    const state = createSeedState();
    expect(state.mahasiswa).toHaveLength(254);
    expect(state.kriteria).toHaveLength(5);
    const rows = getPenilaianRows(state);
    expect(rows.every((r) => Object.keys(r.nilai).length === 5)).toBe(true);
    const a1 = state.mahasiswa.find((m) => m.altCode === 'A1')!;
    expect(a1.nim).toBe('236661001');
    expect(a1.nama).toBe('Irvan Topa');
    expect(state.processedAt).toBeNull();
  });
});

describe('mahasiswa', () => {
  it('creates a mahasiswa with the next available alt code', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' }, { nim: '2', nama: 'Dua' });
    const { mahasiswa } = createMahasiswa(state, { nim: '3', nama: 'Tiga' });
    expect(mahasiswa.altCode).toBe('A3');
    expect(mahasiswa.programStudi).toBe('Teknologi Rekayasa Komputer');
  });

  it('rejects a duplicate NIM on create', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' });
    expect(() => createMahasiswa(state, { nim: '1', nama: 'Duplikat' })).toThrow(StoreError);
  });

  it('rejects blank NIM or nama', () => {
    expect(() => createMahasiswa(emptyState(), { nim: ' ', nama: 'X' })).toThrow(/wajib/);
    expect(() => createMahasiswa(emptyState(), { nim: '1', nama: '' })).toThrow(/wajib/);
  });

  it('updates a mahasiswa and keeps program studi when not provided', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' });
    const id = state.mahasiswa[0].id;
    const next = updateMahasiswa(state, id, { nim: '1', nama: 'Satu Baru' });
    expect(next.mahasiswa[0].nama).toBe('Satu Baru');
    expect(next.mahasiswa[0].programStudi).toBe('Teknologi Rekayasa Komputer');
  });

  it('rejects updating to a NIM used by another mahasiswa', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' }, { nim: '2', nama: 'Dua' });
    expect(() => updateMahasiswa(state, state.mahasiswa[1].id, { nim: '1', nama: 'Dua' })).toThrow(/sudah dipakai/);
  });

  it('cascades delete to penilaian and hasil ranking', () => {
    let state = withStudents({ nim: '1', nama: 'Satu', nilai: FULL }, { nim: '2', nama: 'Dua', nilai: { ...FULL, C1: 50 } });
    state = runProses(state, new Date('2026-01-01T00:00:00Z')).state;
    const id = state.mahasiswa[0].id;

    const next = deleteMahasiswa(state, id);

    expect(next.mahasiswa.find((m) => m.id === id)).toBeUndefined();
    expect(next.penilaian[id]).toBeUndefined();
    expect(next.hasilRanking.find((h) => h.mahasiswaId === id)).toBeUndefined();
  });

  it('does not mutate the previous state', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' });
    createMahasiswa(state, { nim: '2', nama: 'Dua' });
    expect(state.mahasiswa).toHaveLength(1);
  });

  it('sorts mahasiswa by the numeric part of the alt code', () => {
    const state = createSeedState();
    const codes = getMahasiswaSorted(state).slice(0, 11).map((m) => m.altCode);
    expect(codes).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11']);
  });
});

describe('kriteria', () => {
  const base = { nama: 'Kehadiran', jenis: 'benefit' as const, bobot: 0.2, preferenceFunction: 'linear' as const };

  it('updates bobot', () => {
    const state = emptyState();
    const next = updateKriteria(state, 1, { ...base, parameterP: 20 });
    expect(next.kriteria[0].bobot).toBe(0.2);
  });

  it('rejects a linear kriteria with missing, zero, or negative parameter p', () => {
    const state = emptyState();
    expect(() => updateKriteria(state, 1, { ...base, parameterP: null })).toThrow(/positif/);
    expect(() => updateKriteria(state, 1, { ...base, parameterP: 0 })).toThrow(/positif/);
    expect(() => updateKriteria(state, 1, { ...base, parameterP: -5 })).toThrow(/positif/);
  });

  it('rejects an invalid jenis and a non-positive bobot', () => {
    const state = emptyState();
    expect(() => updateKriteria(state, 1, { ...base, jenis: 'invalid' as any, parameterP: 20 })).toThrow(/Jenis/);
    expect(() => updateKriteria(state, 1, { ...base, bobot: 0, parameterP: 20 })).toThrow(/Bobot/);
  });

  it('clears parameter p when switching to usual', () => {
    const next = updateKriteria(emptyState(), 1, { ...base, preferenceFunction: 'usual', parameterP: 20 });
    expect(next.kriteria[0].parameterP).toBeNull();
  });
});

describe('penilaian', () => {
  it('upserts nilai for the given kriteria', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' });
    const next = updatePenilaian(state, state.mahasiswa[0].id, { C1: 95 });
    expect(next.penilaian[state.mahasiswa[0].id].C1).toBe(95);
  });

  it('rejects blank, null, and non-numeric nilai instead of storing 0', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' });
    const id = state.mahasiswa[0].id;
    expect(() => updatePenilaian(state, id, { C1: '' })).toThrow(/angka/);
    expect(() => updatePenilaian(state, id, { C1: null })).toThrow(/angka/);
    expect(() => updatePenilaian(state, id, { C1: 'abc' })).toThrow(/angka/);
  });

  it('writes nothing when one kode is invalid (all-or-nothing)', () => {
    const state = withStudents({ nim: '1', nama: 'Satu' });
    const id = state.mahasiswa[0].id;
    expect(() => updatePenilaian(state, id, { C1: 5, C9: 1 })).toThrow(/tidak dikenal/);
    expect(state.penilaian[id]).toBeUndefined();
  });
});

describe('importMatriks', () => {
  const row = (altCode: string, nim: string, nama: string) => ({ altCode, nim, nama, c1: 90, c2: 1, c3: 0, c4: 0, c5: 3.5 });

  it('creates new mahasiswa and updates existing ones by NIM', () => {
    const state = withStudents({ nim: '236661001', nama: 'Irvan Topa Lama' });
    const result = importMatriks(state, [row('A1', '236661001', 'Irvan Topa'), row('A2', '999999999', 'Baru')]);
    expect(result.created).toBe(1);
    expect(result.updated).toBe(1);
    const id = state.mahasiswa[0].id;
    expect(result.state.penilaian[id]).toEqual({ C1: 90, C2: 1, C3: 0, C4: 0, C5: 3.5 });
  });

  it('assigns a fresh alt code when a new student collides with an existing alt code', () => {
    let state = emptyState();
    state = createMahasiswa(state, { nim: '111', nama: 'Existing' }).state; // takes A1
    const result = importMatriks(state, [row('A1', '222', 'New Guy')]);
    const codes = result.state.mahasiswa.map((m) => m.altCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(result.created).toBe(1);
  });
});

describe('runProses', () => {
  it('ranks the dominant alternative first', () => {
    const state = withStudents({ nim: '1', nama: 'Satu', nilai: FULL }, { nim: '2', nama: 'Dua', nilai: { ...FULL, C1: 50 } });
    const { state: next, alternatifCount } = runProses(state, new Date());
    expect(alternatifCount).toBe(2);
    expect(getRankingRows(next)[0].nama).toBe('Satu');
    expect(next.processedAt).not.toBeNull();
  });

  it('replaces previous results instead of accumulating', () => {
    let state = withStudents({ nim: '1', nama: 'Satu', nilai: FULL }, { nim: '2', nama: 'Dua', nilai: FULL });
    state = runProses(state, new Date()).state;
    state = runProses(state, new Date()).state;
    expect(state.hasilRanking).toHaveLength(2);
  });

  it('names the student when nilai is incomplete', () => {
    const state = withStudents({ nim: '236661099', nama: 'Mahasiswa Baru' });
    expect(() => runProses(state, new Date())).toThrow(/A1 \(NIM 236661099, Mahasiswa Baru\)/);
  });

  it('rejects an empty dataset', () => {
    expect(() => runProses(emptyState(), new Date())).toThrow(/mahasiswa/);
  });

  it('reproduces Ranking_PROMETHEE.xlsx end-to-end from the seed state', async () => {
    const { state } = runProses(createSeedState(), new Date());
    const rows = getRankingRows(state);
    expect(rows).toHaveLength(254);
    const byAlt = new Map(rows.map((r) => [r.altCode, r]));

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(process.cwd(), 'Ranking_PROMETHEE.xlsx'));
    const sheet = workbook.getWorksheet('Sheet1')!;
    let compared = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const actual = byAlt.get(String(row.getCell(2).value))!;
      expect(actual.ranking).toBe(Number(row.getCell(1).value));
      expect(Math.abs(actual.netFlow - Number(row.getCell(5).value))).toBeLessThan(1e-6);
      compared += 1;
    });
    expect(compared).toBe(254);
    expect(rows[0].nama).toBe('Muhammad Syeh Pullah');
  });
});
