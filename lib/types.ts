export interface Mahasiswa {
  id: number;
  altCode: string;
  nim: string;
  nama: string;
  programStudi: string;
  angkatan: string | null;
}

export interface Kriteria {
  id: number;
  kode: string;
  nama: string;
  jenis: 'benefit' | 'cost';
  bobot: number;
  preferenceFunction: 'usual' | 'linear';
  parameterP: number | null;
}
