export const LAPORAN_TYPES = ['mahasiswa', 'kriteria', 'penilaian', 'ranking'] as const;
export type LaporanType = (typeof LAPORAN_TYPES)[number];
