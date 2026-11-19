import type { Kriteria } from './topsis';

// Bobot Rank Sum sesuai laporan (BAB 3.3), dibulatkan 6 desimal.
export const DEFAULT_KRITERIA: Kriteria[] = [
  { kode: 'C1', jenis: 'benefit', bobot: 0.133333 },
  { kode: 'C2', jenis: 'cost', bobot: 0.333333 },
  { kode: 'C3', jenis: 'cost', bobot: 0.266667 },
  { kode: 'C4', jenis: 'cost', bobot: 0.2 },
  { kode: 'C5', jenis: 'benefit', bobot: 0.066667 },
];
