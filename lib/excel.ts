import ExcelJS from 'exceljs';

export interface MatriksRow {
  altCode: string;
  nim: string;
  nama: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}

function cellNumber(row: ExcelJS.Row, col: number, altCode: string, label: string): number {
  const raw = row.getCell(col).value;
  const resolved = raw && typeof raw === 'object' && 'result' in (raw as any) ? (raw as any).result : raw;
  const num = Number(resolved);
  if (resolved === null || resolved === undefined || resolved === '' || Number.isNaN(num)) {
    throw new Error(`Nilai ${label} kosong atau bukan angka untuk alternatif ${altCode}`);
  }
  return num;
}

function parseWorksheetRows(sheet: ExcelJS.Worksheet): MatriksRow[] {
  const rows: MatriksRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const altCode = String(row.getCell(1).value ?? '').trim();
    if (!altCode) return;
    const nim = String(row.getCell(2).value ?? '').trim();
    const nama = String(row.getCell(3).value ?? '').trim();
    rows.push({
      altCode,
      nim,
      nama,
      c1: cellNumber(row, 4, altCode, 'C1_Kehadiran'),
      c2: cellNumber(row, 5, altCode, 'C2_Alfa'),
      c3: cellNumber(row, 6, altCode, 'C3_Izin'),
      c4: cellNumber(row, 7, altCode, 'C4_Sakit'),
      c5: cellNumber(row, 8, altCode, 'C5_IPK'),
    });
  });
  return rows;
}

export async function parseMatriksKeputusan(filePath: string): Promise<MatriksRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('03_Matriks_Keputusan');
  if (!sheet) {
    throw new Error('Sheet 03_Matriks_Keputusan tidak ditemukan di file Excel');
  }
  return parseWorksheetRows(sheet);
}

export async function parseMatriksKeputusanBuffer(buffer: Buffer): Promise<MatriksRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const sheet = workbook.getWorksheet('03_Matriks_Keputusan');
  if (!sheet) {
    throw new Error('Sheet 03_Matriks_Keputusan tidak ditemukan di file Excel');
  }
  return parseWorksheetRows(sheet);
}

export interface RankingExportRow {
  ranking: number;
  altCode: string;
  nim: string;
  nama: string;
  leavingFlow: number;
  enteringFlow: number;
  netFlow: number;
}

export async function generateRankingExcel(rows: RankingExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ranking PROMETHEE');
  sheet.columns = [
    { header: 'Ranking', key: 'ranking', width: 10 },
    { header: 'Alternatif', key: 'altCode', width: 12 },
    { header: 'NIM', key: 'nim', width: 15 },
    { header: 'Nama', key: 'nama', width: 30 },
    { header: 'Leaving Flow', key: 'leavingFlow', width: 15 },
    { header: 'Entering Flow', key: 'enteringFlow', width: 15 },
    { header: 'Net Flow', key: 'netFlow', width: 15 },
  ];
  rows.forEach((r) => sheet.addRow(r));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
