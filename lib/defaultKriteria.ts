import type { Kriteria } from './promethee';

export const DEFAULT_KRITERIA: Kriteria[] = [
  { kode: 'C1', jenis: 'benefit', bobot: 0.133333, preferenceFunction: 'linear', parameterP: 20.205628 },
  { kode: 'C2', jenis: 'cost', bobot: 0.333333, preferenceFunction: 'usual', parameterP: null },
  { kode: 'C3', jenis: 'cost', bobot: 0.266667, preferenceFunction: 'usual', parameterP: null },
  { kode: 'C4', jenis: 'cost', bobot: 0.2, preferenceFunction: 'usual', parameterP: null },
  { kode: 'C5', jenis: 'benefit', bobot: 0.066667, preferenceFunction: 'linear', parameterP: 1.32 },
];
