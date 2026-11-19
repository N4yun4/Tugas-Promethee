import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseMatriksKeputusan } from './excel';
import { runTopsis, type Alternatif, type Kriteria } from './topsis';
import { DEFAULT_KRITERIA } from './defaultKriteria';
import acuanPymcdm from './__fixtures__/topsis-pymcdm-254.json';

// Contoh perhitungan dari Hanin, Dhandio & Zaria (2023), "Analisis Perbandingan Metode Pendukung
// Keputusan Pemilihan Kos Mahasiswa di Pontianak", JISKA 8(1), doi:10.14421/jiska.2023.8.1.50-65,
// Tabel 15 (data), Tabel 19 (solusi ideal), dan Tabel 21 (D+, D-, preferensi).
describe('runTopsis: contoh perhitungan jurnal JISKA 2023', () => {
  const kriteria: Kriteria[] = [
    { kode: 'C1', jenis: 'cost', bobot: 5 },
    { kode: 'C2', jenis: 'benefit', bobot: 5 },
    { kode: 'C3', jenis: 'cost', bobot: 5 },
    { kode: 'C4', jenis: 'benefit', bobot: 5 },
  ];
  const data = [
    [1, 0.2, 1, 1],
    [0.8, 0.2, 1, 0.5],
    [0.8, 0.2, 0.8, 0.8],
    [0.8, 1, 0.6, 1],
    [0.2, 0.7, 0.6, 0.8],
    [0.4, 0.2, 0.8, 1],
    [0.8, 1, 0.2, 1],
    [0.2, 1, 0.6, 1],
    [0.8, 0.2, 1, 0.5],
    [0.8, 1, 0.4, 1],
  ];
  const alternatifList: Alternatif[] = data.map((row, i) => ({
    id: `A${i + 1}`,
    nilai: { C1: row[0], C2: row[1], C3: row[2], C4: row[3] },
  }));
  const jurnal = [
    { dPlus: 3.072, dMinus: 0.896, preferensi: 0.2258 },
    { dPlus: 2.977, dMinus: 0.444, preferensi: 0.1297 },
    { dPlus: 2.633, dMinus: 0.816, preferensi: 0.2366 },
    { dPlus: 1.578, dMinus: 2.265, preferensi: 0.5894 },
    { dPlus: 1.152, dMinus: 2.343, preferensi: 0.6704 },
    { dPlus: 2.286, dMinus: 1.66, preferensi: 0.4206 },
    { dPlus: 1.331, dMinus: 2.7, preferensi: 0.6698 },
    { dPlus: 0.848, dMinus: 2.843, preferensi: 0.7702 },
    { dPlus: 2.977, dMinus: 0.444, preferensi: 0.1297 },
    { dPlus: 1.397, dMinus: 2.456, preferensi: 0.6374 },
  ];
  const { hasil, solusiIdeal, pembagi } = runTopsis(alternatifList, kriteria);
  const byId = new Map(hasil.map((r) => [r.id, r]));

  it('menghitung pembagi normalisasi seperti Tabel 16', () => {
    expect(pembagi.C1).toBeCloseTo(2.254, 3);
    expect(pembagi.C2).toBeCloseTo(2.166, 3);
    expect(pembagi.C3).toBeCloseTo(2.358, 3);
    expect(pembagi.C4).toBeCloseTo(2.789, 3);
  });

  it('menentukan solusi ideal positif dan negatif seperti Tabel 19', () => {
    expect(solusiIdeal.positif.C1).toBeCloseTo(0.444, 3);
    expect(solusiIdeal.positif.C2).toBeCloseTo(2.309, 3);
    expect(solusiIdeal.positif.C3).toBeCloseTo(0.424, 3);
    expect(solusiIdeal.positif.C4).toBeCloseTo(1.793, 3);
    expect(solusiIdeal.negatif.C1).toBeCloseTo(2.218, 3);
    expect(solusiIdeal.negatif.C2).toBeCloseTo(0.462, 3);
    expect(solusiIdeal.negatif.C3).toBeCloseTo(2.12, 3);
    expect(solusiIdeal.negatif.C4).toBeCloseTo(0.896, 3);
  });

  it('menghasilkan D+, D-, dan nilai preferensi seperti Tabel 21', () => {
    jurnal.forEach((j, i) => {
      const r = byId.get(`A${i + 1}`)!;
      expect(r.dPlus).toBeCloseTo(j.dPlus, 3);
      expect(r.dMinus).toBeCloseTo(j.dMinus, 3);
      expect(r.preferensi).toBeCloseTo(j.preferensi, 4);
    });
  });

  it('memberi peringkat dari preferensi tertinggi; nilai seri mendapat peringkat sama', () => {
    expect(byId.get('A8')!.ranking).toBe(1);
    expect(byId.get('A5')!.ranking).toBe(2);
    expect(byId.get('A7')!.ranking).toBe(3);
    expect(byId.get('A2')!.ranking).toBe(9);
    expect(byId.get('A9')!.ranking).toBe(9);
  });
});

describe('runTopsis: kasus khusus', () => {
  it('kolom bernilai nol semua tidak menyebabkan pembagian dengan nol', () => {
    const { hasil } = runTopsis(
      [
        { id: 'X', nilai: { C1: 10, C2: 0 } },
        { id: 'Y', nilai: { C1: 5, C2: 0 } },
      ],
      [
        { kode: 'C1', jenis: 'benefit', bobot: 0.5 },
        { kode: 'C2', jenis: 'cost', bobot: 0.5 },
      ]
    );
    expect(hasil.map((r) => [r.id, r.preferensi])).toEqual([
      ['X', 1],
      ['Y', 0],
    ]);
  });

  it('menolak data yang seluruh alternatifnya identik', () => {
    expect(() =>
      runTopsis(
        [
          { id: 'X', nilai: { C1: 3 } },
          { id: 'Y', nilai: { C1: 3 } },
        ],
        [{ kode: 'C1', jenis: 'benefit', bobot: 1 }]
      )
    ).toThrow(/identik/);
  });
});

describe('runTopsis: data 254 mahasiswa dari dataset_promethee.xlsx', () => {
  async function hitung() {
    const rows = await parseMatriksKeputusan(path.join(process.cwd(), 'dataset_promethee.xlsx'));
    const alternatifList: Alternatif[] = rows.map((r) => ({
      id: r.altCode,
      nilai: { C1: r.c1, C2: r.c2, C3: r.c3, C4: r.c4, C5: r.c5 },
    }));
    return runTopsis(alternatifList, DEFAULT_KRITERIA);
  }

  it('sama dengan hasil pustaka pymcdm untuk seluruh 254 alternatif', async () => {
    const { hasil } = await hitung();
    const acuan = acuanPymcdm.preferensi as Record<string, number>;
    expect(hasil).toHaveLength(254);
    for (const r of hasil) {
      expect(Math.abs(r.preferensi - acuan[r.id]), r.id).toBeLessThan(1e-12);
    }
  });

  it('menempatkan A24 (Muhammad Syeh Pullah) di peringkat 1 dengan preferensi 1', async () => {
    const { hasil } = await hitung();
    expect(hasil[0].id).toBe('A24');
    expect(hasil[0].ranking).toBe(1);
    expect(hasil[0].preferensi).toBeCloseTo(1, 12);
    expect(hasil[hasil.length - 1].id).toBe('A239');
  });
});
