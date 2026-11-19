import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { parseMatriksKeputusan, parseMatriksKeputusanBuffer, generateRankingExcel } from './excel';

describe('parseMatriksKeputusan', () => {
  it('parses all 254 rows from the real dataset', async () => {
    const filePath = path.join(process.cwd(), 'dataset_promethee.xlsx');
    const rows = await parseMatriksKeputusan(filePath);
    expect(rows).toHaveLength(254);
    const a1 = rows.find((r) => r.altCode === 'A1')!;
    expect(a1.nim).toBe('236661001');
    expect(a1.nama).toBe('Irvan Topa');
    expect(a1.c1).toBeCloseTo(99.1341991341991, 6);
    expect(a1.c5).toBe(3.94);
  });

  it('throws a descriptive error when a value cell is blank', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('03_Matriks_Keputusan');
    sheet.addRow(['Alternatif', 'NIM', 'Nama', 'C1_Kehadiran', 'C2_Alfa', 'C3_Izin', 'C4_Sakit', 'C5_IPK']);
    sheet.addRow(['A1', '236661001', 'Irvan Topa', 99.13, null, 0, 0, 3.94]);
    const tmpPath = path.join(process.cwd(), 'tmp-blank-test.xlsx');
    await workbook.xlsx.writeFile(tmpPath);

    await expect(parseMatriksKeputusan(tmpPath)).rejects.toThrow(/C2_Alfa kosong/);

    fs.unlinkSync(tmpPath);
  });
});

describe('parseMatriksKeputusanBuffer', () => {
  it('parses rows from an in-memory buffer the same way as from a file', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('03_Matriks_Keputusan');
    sheet.addRow(['Alternatif', 'NIM', 'Nama', 'C1_Kehadiran', 'C2_Alfa', 'C3_Izin', 'C4_Sakit', 'C5_IPK']);
    sheet.addRow(['A1', '236661001', 'Irvan Topa', 99.13, 0, 0, 0, 3.94]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const rows = await parseMatriksKeputusanBuffer(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0].nim).toBe('236661001');
  });

  it('accepts a plain ArrayBuffer, as a browser File.arrayBuffer() returns', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('03_Matriks_Keputusan');
    sheet.addRow(['Alternatif', 'NIM', 'Nama', 'C1_Kehadiran', 'C2_Alfa', 'C3_Izin', 'C4_Sakit', 'C5_IPK']);
    sheet.addRow(['A1', '236661001', 'Irvan Topa', 99.13, 0, 0, 0, 3.94]);
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    const rows = await parseMatriksKeputusanBuffer(arrayBuffer);
    expect(rows).toHaveLength(1);
  });
});

describe('generateRankingExcel', () => {
  it('writes all provided rows into the worksheet', async () => {
    const buffer = await generateRankingExcel([
      { ranking: 1, altCode: 'A24', nim: '236661025', nama: 'Muhammad Syeh Pullah', dPlus: 0, dMinus: 0.198116, preferensi: 1 },
    ]);
    expect(Buffer.isBuffer(buffer)).toBe(false);
    expect(buffer).toBeInstanceOf(Uint8Array);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet('Ranking TOPSIS')!;
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getRow(2).getCell(2).value).toBe('A24');
  });
});
