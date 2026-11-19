# SPK Penentuan Peringkat Mahasiswa (TOPSIS)

Aplikasi web Sistem Pendukung Keputusan untuk meranking 254 mahasiswa Teknologi Rekayasa Komputer berdasarkan lima kriteria (kehadiran, alfa, izin, sakit, dan IPK) dengan metode **TOPSIS** (*Technique for Order of Preference by Similarity to Ideal Solution*). Data mahasiswa, nilai, dan bobot Rank Sum sama dengan laporan; yang diganti hanya metode perhitungannya.

Versi online: **https://n4yun4.github.io/Tugas-Promethee/**

---

## Menjalankan di komputer sendiri (localhost)

### 1. Siapkan Node.js

Aplikasi ini butuh **Node.js versi 18.18 atau lebih baru**. Program `npm` sudah otomatis ikut terpasang bersama Node.js.

Cek apakah sudah terpasang. Buka terminal (PowerShell, Command Prompt, atau terminal di VS Code), lalu ketik:

```bash
node -v
npm -v
```

Kalau muncul nomor versi (misalnya `v20.11.0` dan `10.2.4`), lanjut ke langkah 2.

Kalau muncul pesan *"node is not recognized"* atau *"command not found"*:

1. Buka https://nodejs.org lalu unduh versi **LTS**.
2. Jalankan installer-nya, dan klik **Next** sampai selesai (pengaturan bawaan sudah cukup).
3. **Tutup lalu buka lagi terminal**, kemudian ulangi `node -v` untuk memastikan.

### 2. Ambil kode program

**Cara A — dengan Git** (kalau Git sudah terpasang):

```bash
git clone https://github.com/N4yun4/Tugas-Promethee.git
cd Tugas-Promethee
```

**Cara B — tanpa Git:**

1. Buka https://github.com/N4yun4/Tugas-Promethee
2. Klik tombol hijau **Code** → **Download ZIP**.
3. Ekstrak file ZIP-nya, lalu buka terminal **di dalam folder hasil ekstrak** (folder yang berisi `package.json`).

### 3. Pasang dependensi

Jalankan perintah ini satu kali saja (atau setiap kali ada perubahan pada `package.json`):

```bash
npm install
```

Proses ini mengunduh semua library yang dibutuhkan ke folder `node_modules` dan biasanya memakan waktu 1–3 menit. Peringatan berwarna kuning (`npm warn ...`) atau pesan `vulnerabilities` di akhir boleh diabaikan.

### 4. Jalankan aplikasi

```bash
npm run dev
```

Tunggu sampai terminal menampilkan kurang lebih seperti ini:

```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 3s
```

### 5. Buka di browser

Buka **http://localhost:3000** di browser (Chrome, Edge, atau Firefox).

Saat halaman pertama kali dibuka, ada jeda beberapa detik karena halaman sedang dikompilasi. Pembukaan berikutnya akan lebih cepat.

> Kalau port 3000 sedang dipakai program lain, Next.js otomatis pindah ke 3001, 3002, dan seterusnya. Lihat baris `- Local:` di terminal untuk alamat yang benar.

### 6. Menghentikan aplikasi

Kembali ke terminal tempat `npm run dev` berjalan, lalu tekan **Ctrl + C**. Kalau ditanya `Terminate batch job (Y/N)?`, ketik **Y** lalu Enter.

Untuk menjalankan lagi lain kali, cukup ulangi langkah 4 dan 5. Langkah 1–3 tidak perlu diulang.

---

## Cara memakai aplikasi

1. **Dashboard** — menampilkan ringkasan data: 254 mahasiswa, 5 kriteria, dan 1270 nilai.
2. **Proses TOPSIS** — klik **Jalankan Proses** untuk menghitung jarak ke solusi ideal (D+ dan D−) dan nilai preferensi (V). Solusi ideal A+ dan A− hasil proses terakhir ditampilkan di halaman ini.
3. **Hasil Ranking** — menampilkan peringkat seluruh mahasiswa, diurutkan dari nilai preferensi tertinggi. Peringkat #1 adalah Muhammad Syeh Pullah (V = 1,000000).
4. **Laporan** — pratinjau laporan, cetak atau simpan sebagai PDF, dan export hasil ranking ke Excel.
5. **Data Mahasiswa / Data Kriteria / Data Penilaian** — menambah, mengubah, menghapus, dan mengimpor data dari Excel.

**Penting:** perubahan data disimpan di **browser yang sedang dipakai** (localStorage). Data tidak tersimpan ke file dan tidak terlihat dari browser atau komputer lain. Untuk kembali ke data awal 254 mahasiswa, klik **Reset ke data awal** di Dashboard.

---

## Perintah lain (opsional)

| Perintah | Kegunaan |
|---|---|
| `npm test` | Menjalankan test otomatis, termasuk pengecekan perhitungan TOPSIS terhadap contoh jurnal dan pustaka `pymcdm` (lihat bagian Metode TOPSIS). |
| `npm run build` | Membuat versi siap-online (file statis) di folder `out/`. |
| `npm run seed:json` | Membuat ulang data awal (`lib/seed-data.json`) dari `dataset_promethee.xlsx` sheet `03_Matriks_Keputusan`. Jalankan ini kalau isi Excel-nya diubah. |

---

## Mengatasi masalah umum

**`npm` tidak dikenali / `'npm' is not recognized`**
Node.js belum terpasang, atau terminal dibuka sebelum instalasi selesai. Ulangi langkah 1, lalu **buka terminal baru**.

**PowerShell: `npm.ps1 cannot be loaded because running scripts is disabled on this system`**
Ini pembatasan bawaan Windows. Pilih salah satu solusi:
- Pakai **Command Prompt** (cmd), bukan PowerShell, atau
- Ketik `npm.cmd` sebagai pengganti `npm` (contoh: `npm.cmd install`, `npm.cmd run dev`), atau
- Izinkan script untuk akun kamu, lalu buka terminal baru:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```

**`Port 3000 is in use`**
Program lain (atau `npm run dev` yang masih jalan di terminal lain) sedang memakai port 3000. Tutup terminal lama itu, atau pakai alamat port lain yang ditampilkan di terminal.

**`npm install` gagal karena koneksi**
Pastikan internet stabil, lalu jalankan ulang `npm install`.

**Data terlihat berbeda / ranking hilang**
Data tersimpan per browser. Jalankan **Proses TOPSIS** lagi, atau klik **Reset ke data awal** di Dashboard.

---

## Metode TOPSIS

Langkah perhitungan mengikuti Hwang & Yoon (1981), *Multiple Attribute Decision Making: Methods and Applications*:

1. **Matriks keputusan** X: nilai C1–C5 setiap mahasiswa.
2. **Normalisasi vektor**: r_ij = x_ij / √(Σ x_ij²).
3. **Normalisasi terbobot**: y_ij = w_j × r_ij, dengan bobot Rank Sum C1 0,133333; C2 0,333333; C3 0,266667; C4 0,2; C5 0,066667.
4. **Solusi ideal**: untuk kriteria benefit (C1 Kehadiran, C5 IPK) A+ = nilai maksimum dan A− = minimum; untuk kriteria cost (C2 Alfa, C3 Izin, C4 Sakit) sebaliknya.
5. **Jarak Euclidean**: D+ = √Σ(y_ij − A+_j)² dan D− = √Σ(y_ij − A−_j)².
6. **Nilai preferensi**: V_i = D− / (D+ + D−). Ranking diurutkan dari V terbesar; nilai yang sama mendapat peringkat yang sama.

Kebenaran perhitungan diuji di `lib/topsis.test.ts`:

- mereproduksi contoh perhitungan jurnal Hanin, Dhandio & Zaria (2023), *JISKA* 8(1), doi:10.14421/jiska.2023.8.1.50-65 (pembagi, A+, A−, D+, D−, dan V);
- hasil untuk 254 mahasiswa sama dengan pustaka Python independen [pymcdm](https://pypi.org/project/pymcdm/) (`lib/__fixtures__/topsis-pymcdm-254.json`).

## Teknologi

Next.js 14 (static export), React 18, TypeScript, Tailwind CSS, dan ExcelJS. Test memakai Vitest. Setiap push ke branch `master` otomatis dideploy ke GitHub Pages lewat `.github/workflows/deploy-pages.yml`.
