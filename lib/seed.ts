import seedData from './seed-data.json';
import { DEFAULT_KRITERIA } from './defaultKriteria';
import type { AppState } from './store';
import type { MatriksRow } from './excel';

const KRITERIA_NAMA: Record<string, string> = {
  C1: 'Kehadiran',
  C2: 'Jumlah Alfa',
  C3: 'Jumlah Izin',
  C4: 'Jumlah Sakit',
  C5: 'Nilai Akademik (IPK)',
};

export function createSeedState(): AppState {
  const rows = seedData.rows as MatriksRow[];
  const penilaian: AppState['penilaian'] = {};
  const mahasiswa = rows.map((row, index) => {
    const id = index + 1;
    penilaian[id] = { C1: row.c1, C2: row.c2, C3: row.c3, C4: row.c4, C5: row.c5 };
    return {
      id,
      altCode: row.altCode,
      nim: row.nim,
      nama: row.nama,
      programStudi: 'Teknologi Rekayasa Komputer',
      angkatan: null,
    };
  });

  return {
    version: 2,
    nextMahasiswaId: rows.length + 1,
    mahasiswa,
    kriteria: DEFAULT_KRITERIA.map((k, index) => ({ id: index + 1, nama: KRITERIA_NAMA[k.kode], ...k })),
    penilaian,
    hasilRanking: [],
    solusiIdeal: null,
    processedAt: null,
  };
}
