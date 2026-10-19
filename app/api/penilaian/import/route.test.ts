import { describe, it, expect, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { resetDbSingleton, getDb } from '@/lib/db';
import { DEFAULT_KRITERIA } from '@/lib/defaultKriteria';
import { POST } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  for (const k of DEFAULT_KRITERIA) {
    db.prepare(
      `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(k.kode, k.kode, k.jenis, k.bobot, k.preferenceFunction, k.parameterP);
  }
});

async function buildTestWorkbook(): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('03_Matriks_Keputusan');
  sheet.addRow(['Alternatif', 'NIM', 'Nama', 'C1_Kehadiran', 'C2_Alfa', 'C3_Izin', 'C4_Sakit', 'C5_IPK']);
  sheet.addRow(['A1', '236661001', 'Irvan Topa', 99.13, 0, 0, 0, 3.94]);
  sheet.addRow(['A2', '999999999', 'Mahasiswa Baru', 90, 1, 0, 0, 3.5]);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

describe('POST /api/penilaian/import', () => {
  it('creates new mahasiswa and updates existing ones by NIM', async () => {
    const db = getDb();
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa Lama')`).run();

    const formData = new FormData();
    formData.append('file', await buildTestWorkbook(), 'dataset.xlsx');

    const res = await POST(new Request('http://localhost/api/penilaian/import', { method: 'POST', body: formData }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(1);
    expect(body.updated).toBe(1);
    expect(body.total).toBe(2);
  });

  it('returns 400 when no file is attached', async () => {
    const formData = new FormData();
    const res = await POST(new Request('http://localhost/api/penilaian/import', { method: 'POST', body: formData }));
    expect(res.status).toBe(400);
  });

  it('assigns a fresh alt_code instead of crashing when a new student reuses an existing alt_code', async () => {
    const db = getDb();
    // An existing student already holds alt_code 'A2' under a different NIM than the import row below.
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','111111111','Existing A2')`).run();

    const formData = new FormData();
    formData.append('file', await buildTestWorkbook(), 'dataset.xlsx');

    const res = await POST(new Request('http://localhost/api/penilaian/import', { method: 'POST', body: formData }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(2);
    expect(body.updated).toBe(0);

    const rows = db.prepare('SELECT alt_code as altCode, nim FROM mahasiswa ORDER BY id').all() as { altCode: string; nim: string }[];
    const altCodes = rows.map((r) => r.altCode);
    expect(new Set(altCodes).size).toBe(altCodes.length);
  });
});
