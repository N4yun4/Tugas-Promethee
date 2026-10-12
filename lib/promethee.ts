export type JenisKriteria = 'benefit' | 'cost';
export type PreferenceFunction = 'usual' | 'linear';

export interface Kriteria {
  kode: string;
  jenis: JenisKriteria;
  bobot: number;
  preferenceFunction: PreferenceFunction;
  parameterP: number | null;
}

export interface Alternatif {
  id: string;
  nilai: Record<string, number>;
}

export interface FlowResult {
  id: string;
  leavingFlow: number;
  enteringFlow: number;
  netFlow: number;
  ranking: number;
}

export function preference(a: number, b: number, k: Kriteria): number {
  const d = k.jenis === 'benefit' ? a - b : b - a;
  if (d <= 0) return 0;
  if (k.preferenceFunction === 'usual') return 1;
  if (k.parameterP == null) {
    throw new Error(`parameterP wajib diisi untuk kriteria linear: ${k.kode}`);
  }
  return Math.min(d / k.parameterP, 1);
}

export function preferenceIndex(a: Alternatif, b: Alternatif, kriteriaList: Kriteria[]): number {
  let total = 0;
  for (const k of kriteriaList) {
    total += k.bobot * preference(a.nilai[k.kode], b.nilai[k.kode], k);
  }
  return total;
}

export function runPromethee(alternatifList: Alternatif[], kriteriaList: Kriteria[]): FlowResult[] {
  const n = alternatifList.length;
  const pembagi = n - 1;

  const leaving = new Map<string, number>();
  const entering = new Map<string, number>();
  for (const a of alternatifList) {
    leaving.set(a.id, 0);
    entering.set(a.id, 0);
  }

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      const pi = preferenceIndex(alternatifList[i], alternatifList[j], kriteriaList);
      leaving.set(alternatifList[i].id, leaving.get(alternatifList[i].id)! + pi);
      entering.set(alternatifList[j].id, entering.get(alternatifList[j].id)! + pi);
    }
  }

  const flows = alternatifList.map((a) => {
    const leavingFlow = leaving.get(a.id)! / pembagi;
    const enteringFlow = entering.get(a.id)! / pembagi;
    return { id: a.id, leavingFlow, enteringFlow, netFlow: leavingFlow - enteringFlow };
  });

  const sorted = [...flows].sort((x, y) => {
    if (y.netFlow !== x.netFlow) return y.netFlow - x.netFlow;
    return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
  });

  const result: FlowResult[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i].netFlow !== sorted[i - 1].netFlow) {
      rank = i + 1;
    }
    result.push({ ...sorted[i], ranking: rank });
  }
  return result;
}
