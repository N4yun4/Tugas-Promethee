# SPK Penentuan Peringkat Mahasiswa (PROMETHEE II)

Aplikasi web Sistem Pendukung Keputusan untuk meranking 254 mahasiswa Teknologi Rekayasa Komputer berdasarkan lima kriteria (kehadiran, alfa, izin, sakit, dan IPK) dengan metode **PROMETHEE II**. Hasil perhitungannya sama persis dengan acuan Kelompok 3 (`Ranking_PROMETHEE.xlsx`).

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
2. **Proses PROMETHEE** — klik **Jalankan Proses** untuk menghitung leaving flow, entering flow, dan net flow.
3. **Hasil Ranking** — menampilkan peringkat seluruh mahasiswa, diurutkan dari net flow tertinggi. Peringkat #1 adalah Muhammad Syeh Pullah (0.458995).
4. **Laporan** — pratinjau laporan, cetak atau simpan sebagai PDF, dan export hasil ranking ke Excel.
5. **Data Mahasiswa / Data Kriteria / Data Penilaian** — menambah, mengubah, menghapus, dan mengimpor data dari Excel.

**Penting:** perubahan data disimpan di **browser yang sedang dipakai** (localStorage). Data tidak tersimpan ke file dan tidak terlihat dari browser atau komputer lain. Untuk kembali ke data awal 254 mahasiswa, klik **Reset ke data awal** di Dashboard.

---

## Perintah lain (opsional)

| Perintah | Kegunaan |
|---|---|
| `npm test` | Menjalankan test otomatis, termasuk pengecekan bahwa hasil ranking sama dengan `Ranking_PROMETHEE.xlsx`. |
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
Data tersimpan per browser. Jalankan **Proses PROMETHEE** lagi, atau klik **Reset ke data awal** di Dashboard.

---

## Teknologi

Next.js 14 (static export), React 18, TypeScript, Tailwind CSS, dan ExcelJS. Test memakai Vitest. Setiap push ke branch `master` otomatis dideploy ke GitHub Pages lewat `.github/workflows/deploy-pages.yml`.
