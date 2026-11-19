// TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution),
// Hwang & Yoon (1981): normalisasi vektor, matriks terbobot, solusi ideal positif/negatif,
// jarak Euclidean, lalu nilai preferensi V = D- / (D+ + D-).

export type JenisKriteria = 'benefit' | 'cost';

export interface Kriteria {
  kode: string;
  jenis: JenisKriteria;
  bobot: number;
}

export interface Alternatif {
  id: string;
  nilai: Record<string, number>;
}

export interface TopsisResult {
  id: string;
  dPlus: number;
  dMinus: number;
  preferensi: number;
  ranking: number;
}

export interface SolusiIdeal {
  positif: Record<string, number>;
  negatif: Record<string, number>;
}

export interface TopsisOutput {
  hasil: TopsisResult[];
  /** Akar jumlah kuadrat tiap kolom kriteria (pembagi normalisasi). */
  pembagi: Record<string, number>;
  solusiIdeal: SolusiIdeal;
}

export function runTopsis(alternatifList: Alternatif[], kriteriaList: Kriteria[]): TopsisOutput {
  // Langkah 1: pembagi normalisasi vektor, sqrt(sum x_ij^2) per kriteria.
  const pembagi: Record<string, number> = {};
  for (const k of kriteriaList) {
    pembagi[k.kode] = Math.sqrt(alternatifList.reduce((sum, a) => sum + a.nilai[k.kode] ** 2, 0));
  }

  // Langkah 2: matriks ternormalisasi terbobot y_ij = w_j * x_ij / pembagi_j.
  // Kolom yang seluruhnya nol tidak membedakan alternatif, jadi nilainya dibuat 0.
  const terbobot = alternatifList.map((a) => {
    const y: Record<string, number> = {};
    for (const k of kriteriaList) {
      y[k.kode] = pembagi[k.kode] === 0 ? 0 : (k.bobot * a.nilai[k.kode]) / pembagi[k.kode];
    }
    return y;
  });

  // Langkah 3: solusi ideal positif (A+) dan negatif (A-).
  const solusiIdeal: SolusiIdeal = { positif: {}, negatif: {} };
  for (const k of kriteriaList) {
    const kolom = terbobot.map((y) => y[k.kode]);
    const max = Math.max(...kolom);
    const min = Math.min(...kolom);
    solusiIdeal.positif[k.kode] = k.jenis === 'benefit' ? max : min;
    solusiIdeal.negatif[k.kode] = k.jenis === 'benefit' ? min : max;
  }

  // Langkah 4 dan 5: jarak Euclidean ke A+ dan A-, lalu nilai preferensi.
  const nilai = alternatifList.map((a, i) => {
    let jumlahPlus = 0;
    let jumlahMinus = 0;
    for (const k of kriteriaList) {
      jumlahPlus += (terbobot[i][k.kode] - solusiIdeal.positif[k.kode]) ** 2;
      jumlahMinus += (terbobot[i][k.kode] - solusiIdeal.negatif[k.kode]) ** 2;
    }
    const dPlus = Math.sqrt(jumlahPlus);
    const dMinus = Math.sqrt(jumlahMinus);
    if (dPlus + dMinus === 0) {
      throw new Error('Nilai preferensi tidak dapat dihitung karena seluruh alternatif memiliki nilai yang identik');
    }
    return { id: a.id, dPlus, dMinus, preferensi: dMinus / (dPlus + dMinus) };
  });

  // Langkah 6: urutkan dari preferensi terbesar; nilai seri mendapat peringkat yang sama.
  const sorted = [...nilai].sort((x, y) => {
    if (y.preferensi !== x.preferensi) return y.preferensi - x.preferensi;
    return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
  });

  const hasil: TopsisResult[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i].preferensi !== sorted[i - 1].preferensi) {
      rank = i + 1;
    }
    hasil.push({ ...sorted[i], ranking: rank });
  }
  return { hasil, pembagi, solusiIdeal };
}
