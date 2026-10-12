import type { Mahasiswa, Kriteria } from './types';

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

export function mapKriteriaRow(row: any): Kriteria {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    jenis: row.jenis,
    bobot: row.bobot,
    preferenceFunction: row.preference_function,
    parameterP: row.parameter_p,
  };
}
