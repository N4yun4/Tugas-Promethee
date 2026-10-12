# SPK Penentuan Peringkat Mahasiswa (PROMETHEE) — Design Spec

Date: 2026-10-12
Status: Approved by user, ready for implementation planning

## 1. Tujuan dan Konteks

Mahasiswa (pengguna) telah menyusun laporan akademik (`Laporan_Gabungan_Kelompok_3_dan_4_PROMETHEE.pdf`)
yang menjelaskan metode PROMETHEE II untuk meranking 254 mahasiswa Teknologi Rekayasa Komputer
berdasarkan 5 kriteria: Kehadiran (benefit), Jumlah Alfa (cost), Jumlah Izin (cost), Jumlah Sakit (cost),
dan IPK (benefit). BAB 4.7–4.10 laporan sudah berisi rancangan wireframe/use-case untuk sebuah aplikasi
Sistem Pendukung Keputusan (SPK) yang mengimplementasikan metode ini.

Tujuan proyek ini: membangun aplikasi SPK nyata yang mengimplementasikan rancangan tersebut, divalidasi
terhadap hasil numerik yang sudah dihitung Kelompok 3 (file `Ranking_PROMETHEE.xlsx`,
`Preference_Index_254.xlsx`), menggunakan dataset yang sudah ada (`dataset_promethee.xlsx`).

Sukses = aplikasi web lokal yang:
- Mengelola data mahasiswa, kriteria, dan penilaian (CRUD).
- Menjalankan proses PROMETHEE II on-demand dan menghasilkan ranking yang **identik** dengan hasil
  acuan Kelompok 3 (A24 Muhammad Syeh Pullah net flow 0.458995, ranking #1, dst).
- Menyediakan laporan yang bisa di-preview, diekspor PDF dan Excel.

## 2. Keputusan yang Sudah Disepakati

| Topik | Keputusan |
|---|---|
| Platform | Web app lokal (dijalankan dengan `npm run dev`, tidak perlu deploy online) |
| Sumber data | Import sekali dari `dataset_promethee.xlsx` (sheet `03_Matriks_Keputusan`) sebagai seed, lalu dikelola lewat UI |
| Autentikasi | Tidak ada login untuk versi ini (halaman Login di laporan di-skip; bisa ditambah nanti) |
| Tech stack | Next.js 14 (App Router) + TypeScript, SQLite lokal |
| Perhitungan PROMETHEE | On-demand lewat tombol "Proses PROMETHEE" di halaman khusus, bukan live/auto recompute |
| Export laporan | PDF dan Excel |

## 3. Arsitektur

Aplikasi full-stack tunggal:

- **Frontend**: Next.js App Router, React Server Components untuk halaman data-heavy (tabel 254 baris),
  Client Components untuk interaktivitas (form, tombol proses).
- **Backend**: Next.js API routes (`app/api/**`) sebagai layer akses data dan menjalankan engine PROMETHEE.
- **Database**: SQLite file lokal (`./data/spk.db`), diakses lewat `better-sqlite3` (sinkron, cocok untuk
  dataset kecil 254 baris, tidak perlu ORM berat).
- **Styling**: Tailwind CSS. Desain visual (warna, tipografi, layout dashboard) digarap memakai skill
  `ui-ux-pro-max` saat implementasi, bukan default generik Tailwind.

Tidak ada kebutuhan deploy, container, atau service eksternal. Semua state di file SQLite lokal.

## 4. Skema Data

```sql
CREATE TABLE mahasiswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alt_code TEXT UNIQUE NOT NULL,      -- 'A1'..'A254'
  nim TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  program_studi TEXT DEFAULT 'Teknologi Rekayasa Komputer',
  angkatan TEXT
);

CREATE TABLE kriteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT UNIQUE NOT NULL,          -- 'C1'..'C5'
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('benefit','cost')),
  bobot REAL NOT NULL,
  preference_function TEXT NOT NULL CHECK (preference_function IN ('usual','linear')),
  parameter_p REAL                    -- NULL untuk 'usual'
);

CREATE TABLE penilaian (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mahasiswa_id INTEGER NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  kriteria_id INTEGER NOT NULL REFERENCES kriteria(id) ON DELETE CASCADE,
  nilai REAL NOT NULL,
  UNIQUE(mahasiswa_id, kriteria_id)
);

CREATE TABLE hasil_ranking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mahasiswa_id INTEGER NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  leaving_flow REAL NOT NULL,
  entering_flow REAL NOT NULL,
  net_flow REAL NOT NULL,
  ranking INTEGER NOT NULL,
  processed_at TEXT NOT NULL          -- ISO timestamp dari run terakhir
);
```

`hasil_ranking` di-replace penuh (delete + insert) setiap kali tombol "Proses PROMETHEE" dijalankan —
tidak menyimpan histori multi-run untuk versi ini (YAGNI; laporan tidak meminta histori).

Matriks preference index 254×254 **tidak disimpan ke DB** — dihitung di memori saat proses berjalan,
karena hanya dipakai untuk menurunkan leaving/entering flow dan tidak perlu di-query terpisah.

## 5. Engine PROMETHEE (`lib/promethee.ts`)

Port langsung dari Lampiran B.1 dan B.2 laporan:

```
preference(a, b, kriteria):
  d = (a - b) jika benefit, (b - a) jika cost
  jika d <= 0: return 0
  jika preference_function == 'usual': return 1
  jika preference_function == 'linear': return min(d / parameter_p, 1)

preferenceIndex(a, b) = sum(bobot[k] * preference(a[k], b[k], k) for k in kriteria)

leavingFlow(a)  = sum(preferenceIndex(a, x) for x != a) / (n - 1)
enteringFlow(a) = sum(preferenceIndex(x, a) for x != a) / (n - 1)
netFlow(a) = leavingFlow(a) - enteringFlow(a)

ranking = urutkan net_flow descending, method 'min' (ties dapat ranking sama, sesuai
          pd.Series.rank(method='min') yang dipakai Lampiran B.2)
```

Bobot dan parameter kriteria **tidak di-hardcode** di engine — dibaca dari tabel `kriteria` saat proses
dijalankan, supaya nilainya tetap terlihat/dikelola lewat halaman Data Kriteria (sesuai rancangan
laporan 4.7.4), meski untuk versi ini nilai awalnya sama persis dengan Kelompok 3.

Kompleksitas O(n²·k) dengan n=254, k=5 → ~323,000 operasi, berjalan sinkron di satu API route dalam
hitungan milidetik–detik, tidak perlu job queue/background worker.

## 6. Import & Seed

Script `scripts/seed.ts` (dijalankan sekali, manual lewat `npm run seed`):
- Baca `dataset_promethee.xlsx` sheet `03_Matriks_Keputusan` (kolom: `Alternatif, NIM, Nama,
  C1_Kehadiran, C2_Alfa, C3_Izin, C4_Sakit, C5_IPK`).
- Insert 254 baris ke `mahasiswa` (alt_code, nim, nama) dan `penilaian` (5 baris per mahasiswa).
- Insert 5 baris `kriteria` dengan bobot Rank Sum dan parameter dari BAB 3.3–3.4 laporan (hardcoded
  sebagai nilai awal, lalu editable lewat UI):

  | kode | nama | jenis | bobot | preference_function | parameter_p |
  |---|---|---|---|---|---|
  | C1 | Kehadiran | benefit | 0.133333 | linear | 20.205628 |
  | C2 | Jumlah Alfa | cost | 0.333333 | usual | null |
  | C3 | Jumlah Izin | cost | 0.266667 | usual | null |
  | C4 | Jumlah Sakit | cost | 0.200000 | usual | null |
  | C5 | Nilai Akademik (IPK) | benefit | 0.066667 | linear | 1.32 |

Fitur **import Excel lewat UI** (re-upload) di halaman Data Penilaian pakai parser Excel yang sama
(reuse logic seed), untuk kasus dataset diperbarui di kemudian hari.

## 7. Halaman Aplikasi

Mengikuti BAB 4.7 laporan, tanpa halaman Login (lihat §2):

1. **Dashboard** (`/`) — kartu ringkasan (jumlah mahasiswa, kriteria, status proses terakhir), grafik
   top-5 ranking, info metode.
2. **Data Mahasiswa** (`/mahasiswa`) — tabel 254 baris dengan search, pagination, tambah/edit/hapus
   (form terpisah di §7a).
3. **Data Kriteria** (`/kriteria`) — tabel 5 kriteria dengan bobot, jenis, fungsi preferensi; editable.
4. **Data Penilaian** (`/penilaian`) — tabel nilai C1–C5 per mahasiswa, tombol Import Excel, tambah/edit,
   link ke Detail Penilaian per mahasiswa.
5. **Proses PROMETHEE** (`/proses`) — tombol "Jalankan Proses", menampilkan status tahapan (preference
   function → preference index → leaving/entering flow → net flow → ranking tersimpan), durasi proses.
6. **Hasil Ranking** (`/ranking`) — tabel full 254 baris terurut net flow (peringkat, NIM, nama, leaving,
   entering, net flow), badge untuk top-3.
7. **Laporan** (`/laporan`) — pilih jenis laporan (data mahasiswa / kriteria / penilaian / ranking) →
   Preview → tombol Export PDF, Export Excel.
8. **Detail Penilaian** (`/penilaian/[id]`) — identitas mahasiswa + rincian nilai C1–C5.

Form Tambah/Edit Mahasiswa dan Form Tambah/Edit Penilaian adalah modal/halaman terpisah dari §2 dan §4
di atas (bukan halaman independen baru), sesuai BAB 4.7.9 laporan.

Halaman Login dan pemisahan role Admin/Pimpinan (BAB 4.10, Use Case) **tidak diimplementasikan** di
versi ini (lihat §2) — semua halaman dapat diakses tanpa autentikasi.

## 8. Export Laporan

- **PDF**: halaman Preview Laporan dirender dengan CSS print-friendly (`@media print`), export lewat
  `window.print()` → "Save as PDF" bawaan browser. Tidak perlu library PDF tambahan — cukup untuk
  kebutuhan cetak/dokumentasi skripsi.
- **Excel**: endpoint API yang generate `.xlsx` memakai `exceljs`, format kolom konsisten dengan
  `Ranking_PROMETHEE.xlsx` yang sudah ada (Ranking, Alternatif, Leaving Flow, Entering Flow, Net Flow).

## 9. Validasi

Test otomatis (`lib/promethee.test.ts`) yang:
1. Load dataset asli dari `dataset_promethee.xlsx` sheet `03_Matriks_Keputusan`.
2. Jalankan engine PROMETHEE.
3. Bandingkan net flow & ranking terhadap `Ranking_PROMETHEE.xlsx` (expect sama persis, atau toleransi
   floating-point kecil, misal 1e-6).
4. Assert eksplisit: A24 (NIM 236661025, Muhammad Syeh Pullah) → ranking 1, net flow ≈ 0.458995.

Test manual tambahan dari BAB 4.2 laporan: π(A1,A2) ≈ 0.007576, π(A1,A3) ≈ 0.203867 — dipakai sebagai
unit test untuk fungsi `preferenceIndex` secara terisolasi.

## 10. Di Luar Lingkup (YAGNI)

- Autentikasi/login, role Admin vs Pimpinan.
- Histori multi-run hasil ranking.
- Deploy online / database server terpisah.
- Penyimpanan matriks preference index 254×254 penuh ke database.
- Edit bobot/parameter kriteria dari hasil otomatis (Rank Sum recompute) — bobot diedit manual sebagai
  angka, bukan dihitung ulang dari "peringkat kepentingan" di UI.
