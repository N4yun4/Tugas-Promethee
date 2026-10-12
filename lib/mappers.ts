import type { Mahasiswa } from './types';

export function mapMahasiswaRow(row: any): Mahasiswa {
  return {
    id: row.id,
    altCode: row.alt_code,
    nim: row.nim,
    nama: row.nama,
    programStudi: row.program_studi,
    angkatan: row.angkatan,
  };
}
