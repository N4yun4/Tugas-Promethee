import { describe, it, expect } from 'vitest';
import path from 'path';
import ExcelJS from 'exceljs';
import { parseMatriksKeputusan } from './excel';
import { preferenceIndex, runPromethee, type Alternatif, type Kriteria } from './promethee';
import { DEFAULT_KRITERIA } from './defaultKriteria';

describe('preferenceIndex manual verification (BAB 4.2 report)', () => {
  const a1: Alternatif = { id: 'A1', nilai: { C1: 99.134199, C2: 0, C3: 0, C4: 0, C5: 3.94 } };
  const a2: Alternatif = { id: 'A2', nilai: { C1: 99.134199, C2: 0, C3: 0, C4: 0, C5: 3.79 } };
  const a3: Alternatif = { id: 'A3', nilai: { C1: 98.701299, C2: 0, C3: 0, C4: 1, C5: 3.92 } };

  it('pi(A1, A2) is approximately 0.007576', () => {
    expect(preferenceIndex(a1, a2, DEFAULT_KRITERIA)).toBeCloseTo(0.007576, 6);
  });

  it('pi(A1, A3) is approximately 0.203867', () => {
    expect(preferenceIndex(a1, a3, DEFAULT_KRITERIA)).toBeCloseTo(0.203867, 6);
  });
});

describe('runPromethee ranking ties', () => {
  it('assigns the same rank to alternatives with equal net flow (method=min)', () => {
    const kriteria: Kriteria[] = [
      { kode: 'C1', jenis: 'benefit', bobot: 1, preferenceFunction: 'usual', parameterP: null },
    ];
    const alternatifList: Alternatif[] = [
      { id: 'X', nilai: { C1: 10 } },
      { id: 'Y', nilai: { C1: 5 } },
      { id: 'Z', nilai: { C1: 5 } },
    ];
    const result = runPromethee(alternatifList, kriteria);
    const byId = new Map(result.map((r) => [r.id, r]));
    expect(byId.get('X')!.ranking).toBe(1);
    expect(byId.get('Y')!.ranking).toBe(2);
    expect(byId.get('Z')!.ranking).toBe(2);
  });
});

describe('runPromethee regression against Kelompok 3 reference output', () => {
  it('matches Ranking_PROMETHEE.xlsx for all 254 alternatives', async () => {
    const matriksRows = await parseMatriksKeputusan(path.join(process.cwd(), 'dataset_promethee.xlsx'));
    const alternatifList: Alternatif[] = matriksRows.map((r) => ({
      id: r.altCode,
      nilai: { C1: r.c1, C2: r.c2, C3: r.c3, C4: r.c4, C5: r.c5 },
    }));

    const result = runPromethee(alternatifList, DEFAULT_KRITERIA);
    const byId = new Map(result.map((r) => [r.id, r]));

    const acuanWorkbook = new ExcelJS.Workbook();
    await acuanWorkbook.xlsx.readFile(path.join(process.cwd(), 'Ranking_PROMETHEE.xlsx'));
    const sheet = acuanWorkbook.getWorksheet('Sheet1')!;

    let comparedRows = 0;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const acuanRanking = Number(row.getCell(1).value);
      const altCode = String(row.getCell(2).value);
      const acuanLeaving = Number(row.getCell(3).value);
      const acuanEntering = Number(row.getCell(4).value);
      const acuanNetFlow = Number(row.getCell(5).value);

      const actual = byId.get(altCode);
      expect(actual, `missing result for ${altCode}`).toBeDefined();
      expect(Math.abs(actual!.leavingFlow - acuanLeaving)).toBeLessThan(1e-6);
      expect(Math.abs(actual!.enteringFlow - acuanEntering)).toBeLessThan(1e-6);
      expect(Math.abs(actual!.netFlow - acuanNetFlow)).toBeLessThan(1e-6);
      expect(actual!.ranking).toBe(acuanRanking);
      comparedRows += 1;
    });

    expect(comparedRows).toBe(254);
  });

  it('ranks A24 (Muhammad Syeh Pullah) first with net flow approximately 0.458995', async () => {
    const matriksRows = await parseMatriksKeputusan(path.join(process.cwd(), 'dataset_promethee.xlsx'));
    const alternatifList: Alternatif[] = matriksRows.map((r) => ({
      id: r.altCode,
      nilai: { C1: r.c1, C2: r.c2, C3: r.c3, C4: r.c4, C5: r.c5 },
    }));
    const result = runPromethee(alternatifList, DEFAULT_KRITERIA);
    const a24 = result.find((r) => r.id === 'A24')!;
    expect(a24.ranking).toBe(1);
    expect(a24.netFlow).toBeCloseTo(0.458995, 5);
  });
});
