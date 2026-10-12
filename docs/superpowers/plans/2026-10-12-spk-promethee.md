# SPK PROMETHEE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Next.js + SQLite web app that implements PROMETHEE II to rank 254 mahasiswa on 5 criteria, reproducing the validated numeric results from the group's report (`Ranking_PROMETHEE.xlsx`).

**Architecture:** Single Next.js 14 App Router app. Server Components read SQLite directly for page rendering; Client Components call Next.js API routes (`app/api/**`) for mutations (create/update/delete/import/run-proses/export), then call `router.refresh()` to re-render. The PROMETHEE engine is a pure, DB-agnostic TypeScript module tested against the report's reference output.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, `better-sqlite3`, `exceljs`, Vitest, `tsx` (for the seed script).

**Spec:** `docs/superpowers/specs/2026-10-12-spk-promethee-design.md`

## Global Constraints

- Local web app only, run via `npm run dev` — no deploy target, no external services.
- Data persists in a single SQLite file (`./data/spk.db`) accessed via `better-sqlite3`, no ORM.
- No authentication/login in this version — every page and API route is open.
- PROMETHEE recomputation is on-demand only, triggered by the "Jalankan Proses" button on `/proses` — never automatic on data change.
- `hasil_ranking` is fully replaced (delete + insert) on every run; no run history is kept.
- Kriteria bobot/jenis/preference function/parameter live in the `kriteria` table and are read at run time — never hardcoded inside the engine itself.
- Export: PDF via browser print (`window.print()` + print CSS) — no PDF library; Excel via `exceljs`.
- Engine output must match `Ranking_PROMETHEE.xlsx` within 1e-6 tolerance on leaving/entering/net flow, and exactly on ranking integers.
- Default kriteria weights (seed values): C1 Kehadiran benefit/linear/p=20.205628/bobot=0.133333; C2 Alfa cost/usual/bobot=0.333333; C3 Izin cost/usual/bobot=0.266667; C4 Sakit cost/usual/bobot=0.200000; C5 IPK benefit/linear/p=1.32/bobot=0.066667.

## Review Focus

- Ties in net_flow must receive identical ranking (pandas `method='min'` semantics), not an off-by-one rank — covered in Task 4.
- Importing Excel with a blank/non-numeric criterion cell must fail loudly with a row-identifying error, not silently produce `NaN` — covered in Task 3.
- Deleting a mahasiswa must cascade-delete its `penilaian` and `hasil_ranking` rows, which requires `PRAGMA foreign_keys = ON` — covered in Task 2.
- Re-running "Proses PROMETHEE" must fully replace `hasil_ranking`, never accumulate duplicate rows per mahasiswa — covered in Task 9.
- The Excel laporan export must include every ranked row, not just one page of the on-screen table — covered in Task 10.

---

## Task 1: Project Scaffolding & Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `.gitignore`

**Interfaces:**
- Produces: a buildable Next.js app skeleton; `npm run dev`, `npm run build`, `npm run test`, `npm run seed` scripts that later tasks rely on.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "spk-promethee",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "tsx scripts/seed.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "better-sqlite3": "^11.0.0",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^1.6.0",
    "tsx": "^4.7.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Write `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Write `postcss.config.js`**

```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 7: Write `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Write minimal `app/layout.tsx`**

```tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Write minimal `app/page.tsx`**

```tsx
export default function Home() {
  return <main>SPK PROMETHEE</main>;
}
```

- [ ] **Step 10: Write `.gitignore`**

```
node_modules/
.next/
data/
*.db
tmp-*.xlsx
```

- [ ] **Step 11: Install dependencies**

Run: `npm install`

- [ ] **Step 12: Verify the project builds**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 13: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + SQLite project"
```

---

## Task 2: Database Schema & Client

**Files:**
- Create: `lib/db.ts`
- Test: `lib/db.test.ts`

**Interfaces:**
- Produces: `createDb(dbPath: string): Database.Database`, `getDb(dbPath?: string): Database.Database`, `resetDbSingleton(): void`, `DEFAULT_DB_PATH: string`. All later tasks that touch the database import `getDb`/`createDb`/`resetDbSingleton` from `@/lib/db`.

- [ ] **Step 1: Write `lib/db.ts`**

```ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'spk.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS mahasiswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alt_code TEXT UNIQUE NOT NULL,
  nim TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  program_studi TEXT DEFAULT 'Teknologi Rekayasa Komputer',
  angkatan TEXT
);

CREATE TABLE IF NOT EXISTS kriteria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kode TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('benefit','cost')),
  bobot REAL NOT NULL,
  preference_function TEXT NOT NULL CHECK (preference_function IN ('usual','linear')),
  parameter_p REAL
);

CREATE TABLE IF NOT EXISTS penilaian (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mahasiswa_id INTEGER NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  kriteria_id INTEGER NOT NULL REFERENCES kriteria(id) ON DELETE CASCADE,
  nilai REAL NOT NULL,
  UNIQUE(mahasiswa_id, kriteria_id)
);

CREATE TABLE IF NOT EXISTS hasil_ranking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mahasiswa_id INTEGER NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
  leaving_flow REAL NOT NULL,
  entering_flow REAL NOT NULL,
  net_flow REAL NOT NULL,
  ranking INTEGER NOT NULL,
  processed_at TEXT NOT NULL
);
`;

export function createDb(dbPath: string): Database.Database {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

let singleton: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (!singleton) singleton = createDb(dbPath ?? DEFAULT_DB_PATH);
  return singleton;
}

export function resetDbSingleton(): void {
  if (singleton) singleton.close();
  singleton = null;
}
```

- [ ] **Step 2: Write `lib/db.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDb } from './db';

let db: Database.Database;

beforeEach(() => {
  db = createDb(':memory:');
});

describe('schema and cascade delete', () => {
  it('cascades delete from mahasiswa to penilaian and hasil_ranking', () => {
    db.prepare(
      `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
       VALUES ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
    ).run();
    const kriteria = db.prepare(`SELECT id FROM kriteria WHERE kode='C1'`).get() as { id: number };

    const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
    const mahasiswaId = Number(info.lastInsertRowid);

    db.prepare(`INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, 99.13)`).run(mahasiswaId, kriteria.id);
    db.prepare(
      `INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at)
       VALUES (?, 0.1, 0.05, 0.05, 1, '2026-01-01T00:00:00.000Z')`
    ).run(mahasiswaId);

    db.prepare(`DELETE FROM mahasiswa WHERE id = ?`).run(mahasiswaId);

    const penilaianCount = db.prepare(`SELECT COUNT(*) as c FROM penilaian WHERE mahasiswa_id = ?`).get(mahasiswaId) as { c: number };
    const rankingCount = db.prepare(`SELECT COUNT(*) as c FROM hasil_ranking WHERE mahasiswa_id = ?`).get(mahasiswaId) as { c: number };

    expect(penilaianCount.c).toBe(0);
    expect(rankingCount.c).toBe(0);
  });

  it('rejects a duplicate NIM', () => {
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
    expect(() =>
      db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','236661001','Duplikat')`).run()
    ).toThrow();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run lib/db.test.ts`
Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "feat: add SQLite schema and client with cascade delete"
```

---

## Task 3: Excel Parsing & Generation Utilities

**Files:**
- Create: `lib/excel.ts`
- Test: `lib/excel.test.ts`

**Interfaces:**
- Produces: `interface MatriksRow { altCode: string; nim: string; nama: string; c1: number; c2: number; c3: number; c4: number; c5: number }`, `parseMatriksKeputusan(filePath: string): Promise<MatriksRow[]>`, `interface RankingExportRow { ranking: number; altCode: string; nim: string; nama: string; leavingFlow: number; enteringFlow: number; netFlow: number }`, `generateRankingExcel(rows: RankingExportRow[]): Promise<Buffer>`.
- Consumes: nothing from earlier tasks.

- [ ] **Step 1: Write `lib/excel.ts`**

```ts
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
```

- [ ] **Step 2: Write `lib/excel.test.ts`**

```ts
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
});

describe('generateRankingExcel', () => {
  it('writes all provided rows into the worksheet', async () => {
    const buffer = await generateRankingExcel([
      { ranking: 1, altCode: 'A24', nim: '236661025', nama: 'Muhammad Syeh Pullah', leavingFlow: 0.458995, enteringFlow: 0, netFlow: 0.458995 },
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet('Ranking PROMETHEE')!;
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getRow(2).getCell(2).value).toBe('A24');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run lib/excel.test.ts`
Expected: all tests pass (requires `dataset_promethee.xlsx` at the project root, which already exists).

- [ ] **Step 4: Commit**

```bash
git add lib/excel.ts lib/excel.test.ts
git commit -m "feat: add Excel parse/generate utilities with blank-cell validation"
```

---

## Task 4: PROMETHEE Engine

**Files:**
- Create: `lib/promethee.ts`
- Create: `lib/defaultKriteria.ts`
- Test: `lib/promethee.test.ts`

**Interfaces:**
- Produces: `type JenisKriteria = 'benefit' | 'cost'`, `type PreferenceFunction = 'usual' | 'linear'`, `interface Kriteria { kode: string; jenis: JenisKriteria; bobot: number; preferenceFunction: PreferenceFunction; parameterP: number | null }`, `interface Alternatif { id: string; nilai: Record<string, number> }`, `interface FlowResult { id: string; leavingFlow: number; enteringFlow: number; netFlow: number; ranking: number }`, `preference(a: number, b: number, k: Kriteria): number`, `preferenceIndex(a: Alternatif, b: Alternatif, kriteriaList: Kriteria[]): number`, `runPromethee(alternatifList: Alternatif[], kriteriaList: Kriteria[]): FlowResult[]`, `DEFAULT_KRITERIA: Kriteria[]`.
- Consumes: `parseMatriksKeputusan` from `@/lib/excel` (Task 3), in tests only.

- [ ] **Step 1: Write `lib/promethee.ts`**

```ts
export type JenisKriteria = 'benefit' | 'cost';
export type PreferenceFunction = 'usual' | 'linear';

export interface Kriteria {
  kode: string;
  jenis: JenisKriteria;
  bobot: number;
  preferenceFunction: PreferenceFunction;
  parameterP: number | null;
}

export interface Alternatif {
  id: string;
  nilai: Record<string, number>;
}

export interface FlowResult {
  id: string;
  leavingFlow: number;
  enteringFlow: number;
  netFlow: number;
  ranking: number;
}

export function preference(a: number, b: number, k: Kriteria): number {
  const d = k.jenis === 'benefit' ? a - b : b - a;
  if (d <= 0) return 0;
  if (k.preferenceFunction === 'usual') return 1;
  if (k.parameterP == null) {
    throw new Error(`parameterP wajib diisi untuk kriteria linear: ${k.kode}`);
  }
  return Math.min(d / k.parameterP, 1);
}

export function preferenceIndex(a: Alternatif, b: Alternatif, kriteriaList: Kriteria[]): number {
  let total = 0;
  for (const k of kriteriaList) {
    total += k.bobot * preference(a.nilai[k.kode], b.nilai[k.kode], k);
  }
  return total;
}

export function runPromethee(alternatifList: Alternatif[], kriteriaList: Kriteria[]): FlowResult[] {
  const n = alternatifList.length;
  const pembagi = n - 1;

  const leaving = new Map<string, number>();
  const entering = new Map<string, number>();
  for (const a of alternatifList) {
    leaving.set(a.id, 0);
    entering.set(a.id, 0);
  }

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      const pi = preferenceIndex(alternatifList[i], alternatifList[j], kriteriaList);
      leaving.set(alternatifList[i].id, leaving.get(alternatifList[i].id)! + pi);
      entering.set(alternatifList[j].id, entering.get(alternatifList[j].id)! + pi);
    }
  }

  const flows = alternatifList.map((a) => {
    const leavingFlow = leaving.get(a.id)! / pembagi;
    const enteringFlow = entering.get(a.id)! / pembagi;
    return { id: a.id, leavingFlow, enteringFlow, netFlow: leavingFlow - enteringFlow };
  });

  const sorted = [...flows].sort((x, y) => {
    if (y.netFlow !== x.netFlow) return y.netFlow - x.netFlow;
    return x.id < y.id ? -1 : x.id > y.id ? 1 : 0;
  });

  const result: FlowResult[] = [];
  let rank = 1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i].netFlow !== sorted[i - 1].netFlow) {
      rank = i + 1;
    }
    result.push({ ...sorted[i], ranking: rank });
  }
  return result;
}
```

- [ ] **Step 2: Write `lib/defaultKriteria.ts`**

```ts
import type { Kriteria } from './promethee';

export const DEFAULT_KRITERIA: Kriteria[] = [
  { kode: 'C1', jenis: 'benefit', bobot: 0.133333, preferenceFunction: 'linear', parameterP: 20.205628 },
  { kode: 'C2', jenis: 'cost', bobot: 0.333333, preferenceFunction: 'usual', parameterP: null },
  { kode: 'C3', jenis: 'cost', bobot: 0.266667, preferenceFunction: 'usual', parameterP: null },
  { kode: 'C4', jenis: 'cost', bobot: 0.2, preferenceFunction: 'usual', parameterP: null },
  { kode: 'C5', jenis: 'benefit', bobot: 0.066667, preferenceFunction: 'linear', parameterP: 1.32 },
];
```

- [ ] **Step 3: Write `lib/promethee.test.ts`**

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/promethee.test.ts`
Expected: all tests pass, including the 254-row regression test.

- [ ] **Step 5: Commit**

```bash
git add lib/promethee.ts lib/defaultKriteria.ts lib/promethee.test.ts
git commit -m "feat: add PROMETHEE engine validated against Kelompok 3 reference output"
```

---

## Task 5: Seed Script

**Files:**
- Create: `lib/seedCore.ts`
- Create: `scripts/seed.ts`
- Test: `lib/seedCore.test.ts`

**Interfaces:**
- Consumes: `createDb` from `@/lib/db` (Task 2), `parseMatriksKeputusan` from `@/lib/excel` (Task 3), `DEFAULT_KRITERIA` from `@/lib/defaultKriteria` (Task 4).
- Produces: `interface SeedResult { mahasiswaCount: number; kriteriaCount: number; penilaianCount: number; skipped: boolean }`, `runSeed(db: Database.Database, matriksPath: string): Promise<SeedResult>`.

- [ ] **Step 1: Write `lib/seedCore.ts`**

```ts
import type Database from 'better-sqlite3';
import { parseMatriksKeputusan } from './excel';
import { DEFAULT_KRITERIA } from './defaultKriteria';

const KRITERIA_NAMA: Record<string, string> = {
  C1: 'Kehadiran',
  C2: 'Jumlah Alfa',
  C3: 'Jumlah Izin',
  C4: 'Jumlah Sakit',
  C5: 'Nilai Akademik (IPK)',
};

export interface SeedResult {
  mahasiswaCount: number;
  kriteriaCount: number;
  penilaianCount: number;
  skipped: boolean;
}

export async function runSeed(db: Database.Database, matriksPath: string): Promise<SeedResult> {
  const existing = db.prepare('SELECT COUNT(*) as c FROM mahasiswa').get() as { c: number };
  if (existing.c > 0) {
    return { mahasiswaCount: existing.c, kriteriaCount: 0, penilaianCount: 0, skipped: true };
  }

  const insertKriteria = db.prepare(`
    INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
    VALUES (@kode, @nama, @jenis, @bobot, @preferenceFunction, @parameterP)
  `);
  const kriteriaIdByKode = new Map<string, number>();
  const insertKriteriaTx = db.transaction(() => {
    for (const k of DEFAULT_KRITERIA) {
      const info = insertKriteria.run({
        kode: k.kode,
        nama: KRITERIA_NAMA[k.kode],
        jenis: k.jenis,
        bobot: k.bobot,
        preferenceFunction: k.preferenceFunction,
        parameterP: k.parameterP,
      });
      kriteriaIdByKode.set(k.kode, Number(info.lastInsertRowid));
    }
  });
  insertKriteriaTx();

  const rows = await parseMatriksKeputusan(matriksPath);

  const insertMahasiswa = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (@altCode, @nim, @nama)');
  const insertPenilaian = db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)');
  let penilaianCount = 0;

  const insertAllTx = db.transaction(() => {
    for (const row of rows) {
      const info = insertMahasiswa.run({ altCode: row.altCode, nim: row.nim, nama: row.nama });
      const mahasiswaId = Number(info.lastInsertRowid);
      const values: Record<string, number> = { C1: row.c1, C2: row.c2, C3: row.c3, C4: row.c4, C5: row.c5 };
      for (const kode of Object.keys(values)) {
        insertPenilaian.run(mahasiswaId, kriteriaIdByKode.get(kode), values[kode]);
        penilaianCount += 1;
      }
    }
  });
  insertAllTx();

  return { mahasiswaCount: rows.length, kriteriaCount: DEFAULT_KRITERIA.length, penilaianCount, skipped: false };
}
```

- [ ] **Step 2: Write `scripts/seed.ts`**

```ts
import path from 'path';
import { createDb, DEFAULT_DB_PATH } from '../lib/db';
import { runSeed } from '../lib/seedCore';

async function main() {
  const db = createDb(DEFAULT_DB_PATH);
  const matriksPath = path.join(process.cwd(), 'dataset_promethee.xlsx');
  const result = await runSeed(db, matriksPath);

  if (result.skipped) {
    console.log(`Database sudah berisi ${result.mahasiswaCount} mahasiswa, seed dibatalkan. Hapus data/spk.db untuk seed ulang.`);
    return;
  }

  console.log(`Seed selesai: ${result.mahasiswaCount} mahasiswa, ${result.kriteriaCount} kriteria, ${result.penilaianCount} baris penilaian.`);
}

main().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Write `lib/seedCore.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import path from 'path';
import { createDb } from './db';
import { runSeed } from './seedCore';

describe('runSeed', () => {
  it('seeds 254 mahasiswa, 5 kriteria, and 1270 penilaian from the real dataset', async () => {
    const db = createDb(':memory:');
    const matriksPath = path.join(process.cwd(), 'dataset_promethee.xlsx');

    const result = await runSeed(db, matriksPath);

    expect(result.mahasiswaCount).toBe(254);
    expect(result.kriteriaCount).toBe(5);
    expect(result.penilaianCount).toBe(1270);
    expect(result.skipped).toBe(false);

    const a1 = db.prepare('SELECT * FROM mahasiswa WHERE alt_code = ?').get('A1') as any;
    expect(a1.nim).toBe('236661001');
    expect(a1.nama).toBe('Irvan Topa');
  });

  it('refuses to reseed a database that already has mahasiswa rows', async () => {
    const db = createDb(':memory:');
    const matriksPath = path.join(process.cwd(), 'dataset_promethee.xlsx');
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();

    const result = await runSeed(db, matriksPath);

    expect(result.skipped).toBe(true);
    expect(result.mahasiswaCount).toBe(1);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/seedCore.test.ts`
Expected: both tests pass.

- [ ] **Step 5: Run the real seed script**

Run: `npm run seed`
Expected: console prints `Seed selesai: 254 mahasiswa, 5 kriteria, 1270 baris penilaian.` and `data/spk.db` is created.

- [ ] **Step 6: Commit**

```bash
git add lib/seedCore.ts lib/seedCore.test.ts scripts/seed.ts
git commit -m "feat: add seed script loading dataset_promethee.xlsx into SQLite"
```

---

## Task 6: Mahasiswa CRUD API

**Files:**
- Create: `lib/types.ts`
- Create: `lib/mappers.ts`
- Create: `app/api/mahasiswa/route.ts`
- Create: `app/api/mahasiswa/[id]/route.ts`
- Test: `app/api/mahasiswa/route.test.ts`
- Test: `app/api/mahasiswa/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `resetDbSingleton` from `@/lib/db` (Task 2).
- Produces: `interface Mahasiswa { id: number; altCode: string; nim: string; nama: string; programStudi: string; angkatan: string | null }`, `mapMahasiswaRow(row: any): Mahasiswa`. `GET /api/mahasiswa?search=`, `POST /api/mahasiswa`, `GET/PUT/DELETE /api/mahasiswa/[id]`.

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export interface Mahasiswa {
  id: number;
  altCode: string;
  nim: string;
  nama: string;
  programStudi: string;
  angkatan: string | null;
}
```

- [ ] **Step 2: Write `lib/mappers.ts`**

```ts
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
```

- [ ] **Step 3: Write `app/api/mahasiswa/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapMahasiswaRow } from '@/lib/mappers';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();

  const rows = search
    ? db
        .prepare(
          `SELECT * FROM mahasiswa WHERE nim LIKE ? OR nama LIKE ? ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)`
        )
        .all(`%${search}%`, `%${search}%`)
    : db.prepare(`SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)`).all();

  return NextResponse.json(rows.map(mapMahasiswaRow));
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();

  if (!body.nim || !body.nama) {
    return NextResponse.json({ error: 'NIM dan nama wajib diisi' }, { status: 400 });
  }

  const existingNim = db.prepare('SELECT id FROM mahasiswa WHERE nim = ?').get(body.nim);
  if (existingNim) {
    return NextResponse.json({ error: `NIM ${body.nim} sudah terdaftar` }, { status: 409 });
  }

  const maxAlt = db.prepare(`SELECT MAX(CAST(SUBSTR(alt_code, 2) AS INTEGER)) as maxNum FROM mahasiswa`).get() as {
    maxNum: number | null;
  };
  const altCode = `A${(maxAlt.maxNum ?? 0) + 1}`;

  const info = db
    .prepare('INSERT INTO mahasiswa (alt_code, nim, nama, program_studi, angkatan) VALUES (?, ?, ?, ?, ?)')
    .run(altCode, body.nim, body.nama, body.programStudi ?? 'Teknologi Rekayasa Komputer', body.angkatan ?? null);

  const row = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(mapMahasiswaRow(row), { status: 201 });
}
```

- [ ] **Step 4: Write `app/api/mahasiswa/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapMahasiswaRow } from '@/lib/mappers';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  if (!row) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });
  return NextResponse.json(mapMahasiswaRow(row));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await request.json();

  const existing = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });

  if (!body.nim || !body.nama) {
    return NextResponse.json({ error: 'NIM dan nama wajib diisi' }, { status: 400 });
  }

  const dupeNim = db.prepare('SELECT id FROM mahasiswa WHERE nim = ? AND id != ?').get(body.nim, params.id);
  if (dupeNim) {
    return NextResponse.json({ error: `NIM ${body.nim} sudah dipakai mahasiswa lain` }, { status: 409 });
  }

  db.prepare('UPDATE mahasiswa SET nim = ?, nama = ?, program_studi = ?, angkatan = ? WHERE id = ?').run(
    body.nim,
    body.nama,
    body.programStudi ?? 'Teknologi Rekayasa Komputer',
    body.angkatan ?? null,
    params.id
  );

  const row = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  return NextResponse.json(mapMahasiswaRow(row));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });

  db.prepare('DELETE FROM mahasiswa WHERE id = ?').run(params.id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Write `app/api/mahasiswa/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET, POST } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','236661002','Jaslianor Wijaya Aglin')`).run();
});

describe('GET /api/mahasiswa', () => {
  it('returns all mahasiswa ordered by alt_code number', async () => {
    const res = await GET(new Request('http://localhost/api/mahasiswa'));
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].altCode).toBe('A1');
    expect(body[1].nim).toBe('236661002');
  });

  it('filters by search term across nim and nama', async () => {
    const res = await GET(new Request('http://localhost/api/mahasiswa?search=Jaslianor'));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].nama).toBe('Jaslianor Wijaya Aglin');
  });
});

describe('POST /api/mahasiswa', () => {
  it('creates a new mahasiswa with the next available alt_code', async () => {
    const res = await POST(
      new Request('http://localhost/api/mahasiswa', {
        method: 'POST',
        body: JSON.stringify({ nim: '236661099', nama: 'Mahasiswa Baru' }),
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.altCode).toBe('A3');
  });

  it('rejects a duplicate NIM', async () => {
    const res = await POST(
      new Request('http://localhost/api/mahasiswa', {
        method: 'POST',
        body: JSON.stringify({ nim: '236661001', nama: 'Duplikat' }),
      })
    );
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 6: Write `app/api/mahasiswa/[id]/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET, PUT, DELETE } from './route';

let mahasiswaId: number;

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(
    `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
     VALUES ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
  ).run();
  const kriteriaId = (db.prepare(`SELECT id FROM kriteria WHERE kode='C1'`).get() as { id: number }).id;

  const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  mahasiswaId = Number(info.lastInsertRowid);
  db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, 99.13)').run(mahasiswaId, kriteriaId);
});

describe('GET /api/mahasiswa/[id]', () => {
  it('returns 404 for an unknown id', async () => {
    const res = await GET(new Request('http://localhost/api/mahasiswa/999'), { params: { id: '999' } });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/mahasiswa/[id]', () => {
  it('updates nama and nim', async () => {
    const res = await PUT(
      new Request('http://localhost/api/mahasiswa/1', {
        method: 'PUT',
        body: JSON.stringify({ nim: '236661001', nama: 'Irvan Topa Updated' }),
      }),
      { params: { id: String(mahasiswaId) } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nama).toBe('Irvan Topa Updated');
  });
});

describe('DELETE /api/mahasiswa/[id]', () => {
  it('removes the mahasiswa and cascades to penilaian', async () => {
    const res = await DELETE(new Request('http://localhost/api/mahasiswa/1', { method: 'DELETE' }), {
      params: { id: String(mahasiswaId) },
    });
    expect(res.status).toBe(200);

    const db = getDb();
    const remaining = db.prepare('SELECT COUNT(*) as c FROM penilaian WHERE mahasiswa_id = ?').get(mahasiswaId) as {
      c: number;
    };
    expect(remaining.c).toBe(0);
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run app/api/mahasiswa`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/types.ts lib/mappers.ts app/api/mahasiswa
git commit -m "feat: add Mahasiswa CRUD API"
```

---

## Task 7: Kriteria API

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/mappers.ts`
- Create: `app/api/kriteria/route.ts`
- Create: `app/api/kriteria/[id]/route.ts`
- Test: `app/api/kriteria/route.test.ts`
- Test: `app/api/kriteria/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `resetDbSingleton` from `@/lib/db`.
- Produces: `interface Kriteria { id: number; kode: string; nama: string; jenis: 'benefit' | 'cost'; bobot: number; preferenceFunction: 'usual' | 'linear'; parameterP: number | null }`, `mapKriteriaRow(row: any): Kriteria`. `GET /api/kriteria`, `PUT /api/kriteria/[id]`.

- [ ] **Step 1: Add `Kriteria` to `lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Add `mapKriteriaRow` to `lib/mappers.ts`**

```ts
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
```

- [ ] **Step 3: Write `app/api/kriteria/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapKriteriaRow } from '@/lib/mappers';

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM kriteria ORDER BY kode').all();
  return NextResponse.json(rows.map(mapKriteriaRow));
}
```

- [ ] **Step 4: Write `app/api/kriteria/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { mapKriteriaRow } from '@/lib/mappers';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await request.json();

  const existing = db.prepare('SELECT * FROM kriteria WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'Kriteria tidak ditemukan' }, { status: 404 });

  if (body.jenis !== 'benefit' && body.jenis !== 'cost') {
    return NextResponse.json({ error: "Jenis harus 'benefit' atau 'cost'" }, { status: 400 });
  }
  if (body.preferenceFunction !== 'usual' && body.preferenceFunction !== 'linear') {
    return NextResponse.json({ error: "Preference function harus 'usual' atau 'linear'" }, { status: 400 });
  }
  if (body.preferenceFunction === 'linear' && (body.parameterP === null || body.parameterP === undefined)) {
    return NextResponse.json({ error: 'Parameter p wajib diisi untuk fungsi Linear' }, { status: 400 });
  }
  if (typeof body.bobot !== 'number' || body.bobot <= 0) {
    return NextResponse.json({ error: 'Bobot harus berupa angka positif' }, { status: 400 });
  }

  db.prepare('UPDATE kriteria SET nama = ?, jenis = ?, bobot = ?, preference_function = ?, parameter_p = ? WHERE id = ?').run(
    body.nama ?? existing.nama,
    body.jenis,
    body.bobot,
    body.preferenceFunction,
    body.preferenceFunction === 'usual' ? null : body.parameterP,
    params.id
  );

  const row = db.prepare('SELECT * FROM kriteria WHERE id = ?').get(params.id);
  return NextResponse.json(mapKriteriaRow(row));
}
```

- [ ] **Step 5: Write `app/api/kriteria/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(
    `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES
     ('C2','Jumlah Alfa','cost',0.333333,'usual',NULL),
     ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
  ).run();
});

describe('GET /api/kriteria', () => {
  it('returns kriteria ordered by kode', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].kode).toBe('C1');
    expect(body[1].kode).toBe('C2');
    expect(body[0].parameterP).toBe(20.205628);
  });
});
```

- [ ] **Step 6: Write `app/api/kriteria/[id]/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { PUT } from './route';

let kriteriaId: number;

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p)
       VALUES ('C1','Kehadiran','benefit',0.133333,'linear',20.205628)`
    )
    .run();
  kriteriaId = Number(info.lastInsertRowid);
});

describe('PUT /api/kriteria/[id]', () => {
  it('updates bobot', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'benefit', bobot: 0.2, preferenceFunction: 'linear', parameterP: 20 }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bobot).toBe(0.2);
  });

  it('rejects linear preference function without parameterP', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'benefit', bobot: 0.2, preferenceFunction: 'linear', parameterP: null }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(400);
  });

  it('rejects an invalid jenis value', async () => {
    const res = await PUT(
      new Request('http://localhost/api/kriteria/1', {
        method: 'PUT',
        body: JSON.stringify({ nama: 'Kehadiran', jenis: 'invalid', bobot: 0.2, preferenceFunction: 'usual', parameterP: null }),
      }),
      { params: { id: String(kriteriaId) } }
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run app/api/kriteria`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/types.ts lib/mappers.ts app/api/kriteria
git commit -m "feat: add Kriteria API"
```

---

## Task 8: Penilaian API + Excel Import

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/mappers.ts`
- Create: `app/api/penilaian/route.ts`
- Create: `app/api/penilaian/[mahasiswaId]/route.ts`
- Create: `app/api/penilaian/import/route.ts`
- Test: `app/api/penilaian/route.test.ts`
- Test: `app/api/penilaian/[mahasiswaId]/route.test.ts`
- Test: `app/api/penilaian/import/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `resetDbSingleton` from `@/lib/db`; `parseMatriksKeputusanBuffer` from `@/lib/excel`.
- Produces: `interface PenilaianRow { mahasiswaId: number; altCode: string; nim: string; nama: string; nilai: Record<string, number> }`. `GET /api/penilaian`, `PUT /api/penilaian/[mahasiswaId]`, `POST /api/penilaian/import` (multipart, field `file`).

- [ ] **Step 1: Add `PenilaianRow` to `lib/types.ts`**

```ts
export interface PenilaianRow {
  mahasiswaId: number;
  altCode: string;
  nim: string;
  nama: string;
  nilai: Record<string, number>;
}
```

(Append this interface to the existing `lib/types.ts` content from Tasks 6–7, keeping `Mahasiswa` and `Kriteria`.)

- [ ] **Step 2: Write `app/api/penilaian/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const mahasiswaRows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
  const penilaianRows = db
    .prepare(
      `SELECT p.mahasiswa_id as mahasiswaId, k.kode as kode, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id`
    )
    .all() as { mahasiswaId: number; kode: string; nilai: number }[];

  const nilaiByMahasiswa = new Map<number, Record<string, number>>();
  for (const row of penilaianRows) {
    if (!nilaiByMahasiswa.has(row.mahasiswaId)) nilaiByMahasiswa.set(row.mahasiswaId, {});
    nilaiByMahasiswa.get(row.mahasiswaId)![row.kode] = row.nilai;
  }

  const result = mahasiswaRows.map((m) => ({
    mahasiswaId: m.id,
    altCode: m.alt_code,
    nim: m.nim,
    nama: m.nama,
    nilai: nilaiByMahasiswa.get(m.id) ?? {},
  }));

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Write `app/api/penilaian/[mahasiswaId]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { mahasiswaId: string } }) {
  const db = getDb();
  const body = await request.json();

  const mahasiswa = db.prepare('SELECT id FROM mahasiswa WHERE id = ?').get(params.mahasiswaId);
  if (!mahasiswa) return NextResponse.json({ error: 'Mahasiswa tidak ditemukan' }, { status: 404 });

  const kriteriaRows = db.prepare('SELECT id, kode FROM kriteria').all() as { id: number; kode: string }[];
  const kriteriaIdByKode = new Map(kriteriaRows.map((k) => [k.kode, k.id]));

  const nilaiInput: Record<string, unknown> = body.nilai ?? {};
  for (const kode of Object.keys(nilaiInput)) {
    const kriteriaId = kriteriaIdByKode.get(kode);
    if (!kriteriaId) {
      return NextResponse.json({ error: `Kriteria ${kode} tidak dikenal` }, { status: 400 });
    }
    const nilai = Number(nilaiInput[kode]);
    if (Number.isNaN(nilai)) {
      return NextResponse.json({ error: `Nilai ${kode} harus berupa angka` }, { status: 400 });
    }
    db.prepare(
      `INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)
       ON CONFLICT(mahasiswa_id, kriteria_id) DO UPDATE SET nilai = excluded.nilai`
    ).run(params.mahasiswaId, kriteriaId, nilai);
  }

  const updated = db
    .prepare(
      `SELECT k.kode as kode, p.nilai as nilai FROM penilaian p
       JOIN kriteria k ON k.id = p.kriteria_id WHERE p.mahasiswa_id = ?`
    )
    .all(params.mahasiswaId) as { kode: string; nilai: number }[];

  const nilai: Record<string, number> = {};
  for (const row of updated) nilai[row.kode] = row.nilai;

  return NextResponse.json({ mahasiswaId: Number(params.mahasiswaId), nilai });
}
```

- [ ] **Step 4: Write `app/api/penilaian/import/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseMatriksKeputusanBuffer } from '@/lib/excel';

export async function POST(request: Request) {
  const db = getDb();
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'File Excel wajib diunggah' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let rows;
  try {
    rows = await parseMatriksKeputusanBuffer(Buffer.from(arrayBuffer));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const kriteriaRows = db.prepare('SELECT id, kode FROM kriteria').all() as { id: number; kode: string }[];
  const kriteriaIdByKode = new Map(kriteriaRows.map((k) => [k.kode, k.id]));

  const findByNim = db.prepare('SELECT id FROM mahasiswa WHERE nim = ?');
  const insertMahasiswa = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (?, ?, ?)');
  const upsertPenilaian = db.prepare(
    `INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)
     ON CONFLICT(mahasiswa_id, kriteria_id) DO UPDATE SET nilai = excluded.nilai`
  );

  let created = 0;
  let updated = 0;

  const tx = db.transaction(() => {
    for (const row of rows) {
      const existing = findByNim.get(row.nim) as { id: number } | undefined;
      let mahasiswaId: number;
      if (existing) {
        mahasiswaId = existing.id;
        updated += 1;
      } else {
        const info = insertMahasiswa.run(row.altCode, row.nim, row.nama);
        mahasiswaId = Number(info.lastInsertRowid);
        created += 1;
      }
      const values: [string, number][] = [
        ['C1', row.c1],
        ['C2', row.c2],
        ['C3', row.c3],
        ['C4', row.c4],
        ['C5', row.c5],
      ];
      for (const [kode, nilai] of values) {
        const kriteriaId = kriteriaIdByKode.get(kode);
        if (kriteriaId) upsertPenilaian.run(mahasiswaId, kriteriaId, nilai);
      }
    }
  });
  tx();

  return NextResponse.json({ created, updated, total: rows.length });
}
```

- [ ] **Step 5: Write `app/api/penilaian/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C1','Kehadiran','benefit',1,'usual',NULL)`).run();
  const kriteriaId = (db.prepare(`SELECT id FROM kriteria WHERE kode='C1'`).get() as { id: number }).id;
  const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, 99.13)').run(Number(info.lastInsertRowid), kriteriaId);
});

describe('GET /api/penilaian', () => {
  it('returns one pivoted row per mahasiswa with nilai keyed by kriteria kode', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].nilai.C1).toBe(99.13);
  });
});
```

- [ ] **Step 6: Write `app/api/penilaian/[mahasiswaId]/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { PUT } from './route';

let mahasiswaId: number;

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C1','Kehadiran','benefit',1,'usual',NULL)`).run();
  const info = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','236661001','Irvan Topa')`).run();
  mahasiswaId = Number(info.lastInsertRowid);
});

describe('PUT /api/penilaian/[mahasiswaId]', () => {
  it('upserts nilai for the given kriteria', async () => {
    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C1: 95 } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nilai.C1).toBe(95);
  });

  it('rejects an unknown kriteria kode', async () => {
    const res = await PUT(
      new Request('http://localhost/api/penilaian/1', { method: 'PUT', body: JSON.stringify({ nilai: { C9: 1 } }) }),
      { params: { mahasiswaId: String(mahasiswaId) } }
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 7: Write `app/api/penilaian/import/route.test.ts`**

```ts
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
});
```

- [ ] **Step 8: Run tests**

Run: `npx vitest run app/api/penilaian`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add lib/types.ts app/api/penilaian
git commit -m "feat: add Penilaian API and Excel import endpoint"
```

---

## Task 9: Proses PROMETHEE API

**Files:**
- Create: `app/api/proses/route.ts`
- Test: `app/api/proses/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `resetDbSingleton` from `@/lib/db`; `runPromethee`, `Alternatif`, `Kriteria` from `@/lib/promethee`.
- Produces: `POST /api/proses` → `{ processedAt: string; durationMs: number; alternatifCount: number }`; writes `hasil_ranking`.

- [ ] **Step 1: Write `app/api/proses/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runPromethee, type Alternatif, type Kriteria as EngineKriteria } from '@/lib/promethee';

export async function POST() {
  const db = getDb();

  const mahasiswaRows = db.prepare('SELECT id FROM mahasiswa').all() as { id: number }[];
  if (mahasiswaRows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data mahasiswa untuk diproses' }, { status: 400 });
  }

  const kriteriaRows = db.prepare('SELECT * FROM kriteria').all() as any[];
  if (kriteriaRows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data kriteria untuk diproses' }, { status: 400 });
  }
  const engineKriteria: EngineKriteria[] = kriteriaRows.map((k) => ({
    kode: k.kode,
    jenis: k.jenis,
    bobot: k.bobot,
    preferenceFunction: k.preference_function,
    parameterP: k.parameter_p,
  }));

  const penilaianRows = db
    .prepare(
      `SELECT p.mahasiswa_id as mahasiswaId, k.kode as kode, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id`
    )
    .all() as { mahasiswaId: number; kode: string; nilai: number }[];

  const nilaiByMahasiswa = new Map<number, Record<string, number>>();
  for (const row of penilaianRows) {
    if (!nilaiByMahasiswa.has(row.mahasiswaId)) nilaiByMahasiswa.set(row.mahasiswaId, {});
    nilaiByMahasiswa.get(row.mahasiswaId)![row.kode] = row.nilai;
  }

  const alternatifList: Alternatif[] = [];
  for (const m of mahasiswaRows) {
    const nilai = nilaiByMahasiswa.get(m.id);
    if (!nilai || engineKriteria.some((k) => nilai[k.kode] === undefined)) {
      return NextResponse.json(
        { error: `Mahasiswa id ${m.id} belum memiliki nilai lengkap untuk semua kriteria` },
        { status: 400 }
      );
    }
    alternatifList.push({ id: String(m.id), nilai });
  }

  const start = Date.now();
  const result = runPromethee(alternatifList, engineKriteria);
  const durationMs = Date.now() - start;
  const processedAt = new Date().toISOString();

  const deleteAll = db.prepare('DELETE FROM hasil_ranking');
  const insert = db.prepare(
    `INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    deleteAll.run();
    for (const r of result) {
      insert.run(Number(r.id), r.leavingFlow, r.enteringFlow, r.netFlow, r.ranking, processedAt);
    }
  });
  tx();

  return NextResponse.json({ processedAt, durationMs, alternatifCount: alternatifList.length });
}
```

- [ ] **Step 2: Write `app/api/proses/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { POST } from './route';

function seedSmallDataset() {
  const db = getDb();
  db.prepare(
    `INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES
     ('C1','Kehadiran','benefit',0.5,'usual',NULL),
     ('C2','IPK','benefit',0.5,'usual',NULL)`
  ).run();
  const kriteria = db.prepare('SELECT id, kode FROM kriteria').all() as { id: number; kode: string }[];
  const byKode = new Map(kriteria.map((k) => [k.kode, k.id]));

  const students = [
    { altCode: 'A1', nim: '1', nama: 'Satu', c1: 100, c2: 4 },
    { altCode: 'A2', nim: '2', nama: 'Dua', c1: 50, c2: 2 },
  ];
  const ids: { id: number }[] = [];
  for (const s of students) {
    const info = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (?, ?, ?)').run(s.altCode, s.nim, s.nama);
    const id = Number(info.lastInsertRowid);
    ids.push({ id });
    db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)').run(id, byKode.get('C1'), s.c1);
    db.prepare('INSERT INTO penilaian (mahasiswa_id, kriteria_id, nilai) VALUES (?, ?, ?)').run(id, byKode.get('C2'), s.c2);
  }
  return ids;
}

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
});

describe('POST /api/proses', () => {
  it('computes and stores ranking, with the stronger alternative ranked first', async () => {
    const students = seedSmallDataset();
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alternatifCount).toBe(2);

    const db = getDb();
    const rows = db.prepare('SELECT * FROM hasil_ranking ORDER BY ranking').all() as any[];
    expect(rows).toHaveLength(2);
    expect(rows[0].mahasiswa_id).toBe(students[0].id);
    expect(rows[0].ranking).toBe(1);
  });

  it('replaces previous results instead of accumulating on a second run', async () => {
    seedSmallDataset();
    await POST();
    await POST();

    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM hasil_ranking').get() as { c: number };
    expect(count.c).toBe(2);
  });

  it('returns 400 when a mahasiswa is missing a nilai for some kriteria', async () => {
    const db = getDb();
    db.prepare(`INSERT INTO kriteria (kode, nama, jenis, bobot, preference_function, parameter_p) VALUES ('C1','Kehadiran','benefit',1,'usual',NULL)`).run();
    db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','1','Satu')`).run();

    const res = await POST();
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run app/api/proses`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/proses
git commit -m "feat: add Proses PROMETHEE API that replaces hasil_ranking on each run"
```

---

## Task 10: Ranking API + Laporan Excel Export

**Files:**
- Create: `app/api/ranking/route.ts`
- Create: `app/api/laporan/export/excel/route.ts`
- Test: `app/api/ranking/route.test.ts`
- Test: `app/api/laporan/export/excel/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `resetDbSingleton` from `@/lib/db`; `generateRankingExcel` from `@/lib/excel`.
- Produces: `GET /api/ranking`, `GET /api/laporan/export/excel` (returns an `.xlsx` file).

- [ ] **Step 1: Write `app/api/ranking/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow,
              h.processed_at as processedAt
       FROM hasil_ranking h
       JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all();
  return NextResponse.json(rows);
}
```

- [ ] **Step 2: Write `app/api/laporan/export/excel/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateRankingExcel } from '@/lib/excel';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow
       FROM hasil_ranking h
       JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all() as any[];

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Belum ada hasil ranking. Jalankan Proses PROMETHEE terlebih dahulu.' }, { status: 400 });
  }

  const buffer = await generateRankingExcel(rows);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Ranking_PROMETHEE.xlsx"',
    },
  });
}
```

- [ ] **Step 3: Write `app/api/ranking/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
  const db = getDb();
  const now = new Date().toISOString();
  const a = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A1','1','Satu')`).run();
  const b = db.prepare(`INSERT INTO mahasiswa (alt_code, nim, nama) VALUES ('A2','2','Dua')`).run();
  db.prepare(`INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at) VALUES (?, 0.5, 0.1, 0.4, 1, ?)`).run(Number(a.lastInsertRowid), now);
  db.prepare(`INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at) VALUES (?, 0.2, 0.3, -0.1, 2, ?)`).run(Number(b.lastInsertRowid), now);
});

describe('GET /api/ranking', () => {
  it('returns rows ordered by ranking ascending', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].altCode).toBe('A1');
    expect(body[0].ranking).toBe(1);
  });
});
```

- [ ] **Step 4: Write `app/api/laporan/export/excel/route.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';
import { resetDbSingleton, getDb } from '@/lib/db';
import { GET } from './route';

beforeEach(() => {
  resetDbSingleton();
  getDb(':memory:');
});

describe('GET /api/laporan/export/excel', () => {
  it('returns 400 when there is no ranking yet', async () => {
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it('exports every ranked row, not just a single page of results', async () => {
    const db = getDb();
    const now = new Date().toISOString();
    const rowCount = 60;
    for (let i = 1; i <= rowCount; i += 1) {
      const info = db.prepare('INSERT INTO mahasiswa (alt_code, nim, nama) VALUES (?, ?, ?)').run(`A${i}`, String(i), `Mhs ${i}`);
      const id = Number(info.lastInsertRowid);
      db.prepare(
        `INSERT INTO hasil_ranking (mahasiswa_id, leaving_flow, entering_flow, net_flow, ranking, processed_at)
         VALUES (?, 0.1, 0.05, 0.05, ?, ?)`
      ).run(id, i, now);
    }

    const res = await GET();
    expect(res.status).toBe(200);
    const buffer = Buffer.from(await res.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet('Ranking PROMETHEE')!;
    expect(sheet.rowCount).toBe(rowCount + 1);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run app/api/ranking app/api/laporan`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/ranking app/api/laporan
git commit -m "feat: add ranking API and full-dataset Excel export"
```

---

## Task 11: App Shell & Dashboard

**Files:**
- Create: `components/Sidebar.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`.

- [ ] **Step 1: Write `components/Sidebar.tsx`**

```tsx
import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/mahasiswa', label: 'Data Mahasiswa' },
  { href: '/kriteria', label: 'Data Kriteria' },
  { href: '/penilaian', label: 'Data Penilaian' },
  { href: '/proses', label: 'Proses PROMETHEE' },
  { href: '/ranking', label: 'Hasil Ranking' },
  { href: '/laporan', label: 'Laporan' },
];

export function Sidebar() {
  return (
    <nav className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-slate-900">SPK PROMETHEE</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'SPK Penentuan Peringkat Mahasiswa',
  description: 'Sistem Pendukung Keputusan ranking mahasiswa dengan metode PROMETHEE II',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Rewrite `app/page.tsx`**

```tsx
import { getDb } from '@/lib/db';

export default function DashboardPage() {
  const db = getDb();
  const mahasiswaCount = (db.prepare('SELECT COUNT(*) as c FROM mahasiswa').get() as { c: number }).c;
  const kriteriaCount = (db.prepare('SELECT COUNT(*) as c FROM kriteria').get() as { c: number }).c;
  const penilaianCount = (db.prepare('SELECT COUNT(*) as c FROM penilaian').get() as { c: number }).c;
  const lastProcessed = db
    .prepare('SELECT processed_at as processedAt FROM hasil_ranking ORDER BY id DESC LIMIT 1')
    .get() as { processedAt: string } | undefined;
  const top5 = db
    .prepare(
      `SELECT h.ranking as ranking, m.nama as nama, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC LIMIT 5`
    )
    .all() as { ranking: number; nama: string; netFlow: number }[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Mahasiswa" value={mahasiswaCount} />
        <StatCard label="Total Kriteria" value={kriteriaCount} />
        <StatCard label="Total Penilaian" value={penilaianCount} />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Status Proses PROMETHEE</p>
        <p className="mt-1 text-lg font-medium text-slate-900">
          {lastProcessed ? `Terakhir diproses: ${new Date(lastProcessed.processedAt).toLocaleString('id-ID')}` : 'Belum pernah diproses'}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Ranking Lima Besar</p>
        {top5.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada hasil ranking.</p>
        ) : (
          <ol className="space-y-2">
            {top5.map((row) => (
              <li key={row.ranking} className="flex items-center justify-between text-sm">
                <span>#{row.ranking} {row.nama}</span>
                <span className="font-mono text-slate-600">{row.netFlow.toFixed(6)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run seed` (if `data/spk.db` does not already exist), then `npm run dev`.
Open `http://localhost:3000`. Confirm: sidebar with 7 links is visible; stat cards show 254 / 5 / 1270; "Belum pernah diproses" is shown (Proses PROMETHEE hasn't run yet). Sidebar links to pages not built yet (Tasks 12-17) are expected to 404 at this point.

- [ ] **Step 5: Commit**

```bash
git add components/Sidebar.tsx app/layout.tsx app/page.tsx
git commit -m "feat: add app shell with sidebar and Dashboard"
```

---

## Task 12: Data Mahasiswa Page

**Files:**
- Create: `app/mahasiswa/page.tsx`
- Create: `app/mahasiswa/MahasiswaManager.tsx`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`; `mapMahasiswaRow` from `@/lib/mappers`; `Mahasiswa` from `@/lib/types`; API routes from Task 6.

- [ ] **Step 1: Write `app/mahasiswa/page.tsx`**

```tsx
import { getDb } from '@/lib/db';
import { mapMahasiswaRow } from '@/lib/mappers';
import { MahasiswaManager } from './MahasiswaManager';

export default function MahasiswaPage() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all();
  return <MahasiswaManager initialData={rows.map(mapMahasiswaRow)} />;
}
```

- [ ] **Step 2: Write `app/mahasiswa/MahasiswaManager.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Mahasiswa } from '@/lib/types';

const PAGE_SIZE = 20;

export function MahasiswaManager({ initialData }: { initialData: Mahasiswa[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Mahasiswa | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialData;
    return initialData.filter((m) => m.nim.toLowerCase().includes(term) || m.nama.toLowerCase().includes(term));
  }, [initialData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: number) {
    if (!confirm('Hapus mahasiswa ini? Semua nilai terkait juga akan terhapus.')) return;
    const res = await fetch(`/api/mahasiswa/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Gagal menghapus mahasiswa');
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Mahasiswa</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Tambah Mahasiswa
        </button>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <input
        type="text"
        placeholder="Cari NIM atau nama..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Alt.</th>
              <th className="px-4 py-2">NIM</th>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Program Studi</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{m.altCode}</td>
                <td className="px-4 py-2">{m.nim}</td>
                <td className="px-4 py-2">{m.nama}</td>
                <td className="px-4 py-2">{m.programStudi}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditing(m);
                      setShowForm(true);
                    }}
                    className="text-slate-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:underline">
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Menampilkan {pageRows.length} dari {filtered.length} mahasiswa
        </span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
            Sebelumnya
          </button>
          <span>
            Hal {page}/{totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
            Berikutnya
          </button>
        </div>
      </div>

      {showForm && (
        <MahasiswaFormModal
          mahasiswa={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            router.refresh();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function MahasiswaFormModal({
  mahasiswa,
  onClose,
  onSaved,
  onError,
}: {
  mahasiswa: Mahasiswa | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [nim, setNim] = useState(mahasiswa?.nim ?? '');
  const [nama, setNama] = useState(mahasiswa?.nama ?? '');
  const [angkatan, setAngkatan] = useState(mahasiswa?.angkatan ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nim.trim() || !nama.trim()) {
      onError('NIM dan nama wajib diisi');
      return;
    }
    setSaving(true);
    const url = mahasiswa ? `/api/mahasiswa/${mahasiswa.id}` : '/api/mahasiswa';
    const method = mahasiswa ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nim, nama, angkatan: angkatan || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      onError(body.error ?? 'Gagal menyimpan data');
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">{mahasiswa ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">NIM</label>
          <input value={nim} onChange={(e) => setNim(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama</label>
          <input value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Angkatan</label>
          <input value={angkatan ?? ''} onChange={(e) => setAngkatan(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">
            Batal
          </button>
          <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/mahasiswa`.
Confirm: 254 total mahasiswa with pagination (13 pages of 20); searching "Irvan" filters to 1 row; "Tambah Mahasiswa" creates a new row with the next `A255` code; editing a row persists after `router.refresh()`; deleting a row removes it and decrements the count.

- [ ] **Step 4: Commit**

```bash
git add app/mahasiswa
git commit -m "feat: add Data Mahasiswa page with search, pagination, and CRUD"
```

---

## Task 13: Data Kriteria Page

**Files:**
- Create: `app/kriteria/page.tsx`
- Create: `app/kriteria/KriteriaManager.tsx`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`; `mapKriteriaRow` from `@/lib/mappers`; `Kriteria` from `@/lib/types`; API route from Task 7.

- [ ] **Step 1: Write `app/kriteria/page.tsx`**

```tsx
import { getDb } from '@/lib/db';
import { mapKriteriaRow } from '@/lib/mappers';
import { KriteriaManager } from './KriteriaManager';

export default function KriteriaPage() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM kriteria ORDER BY kode').all();
  return <KriteriaManager initialData={rows.map(mapKriteriaRow)} />;
}
```

- [ ] **Step 2: Write `app/kriteria/KriteriaManager.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Kriteria } from '@/lib/types';

export function KriteriaManager({ initialData }: { initialData: Kriteria[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Kriteria | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Data Kriteria</h1>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Kode</th>
              <th className="px-4 py-2">Kriteria</th>
              <th className="px-4 py-2">Jenis</th>
              <th className="px-4 py-2">Bobot</th>
              <th className="px-4 py-2">Fungsi Preferensi</th>
              <th className="px-4 py-2">Parameter p</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {initialData.map((k) => (
              <tr key={k.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{k.kode}</td>
                <td className="px-4 py-2">{k.nama}</td>
                <td className="px-4 py-2 capitalize">{k.jenis}</td>
                <td className="px-4 py-2 font-mono">{k.bobot.toFixed(6)}</td>
                <td className="px-4 py-2 capitalize">{k.preferenceFunction}</td>
                <td className="px-4 py-2 font-mono">{k.parameterP ?? '-'}</td>
                <td className="px-4 py-2">
                  <button onClick={() => setEditing(k)} className="text-slate-600 hover:underline">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <KriteriaFormModal
          kriteria={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function KriteriaFormModal({
  kriteria,
  onClose,
  onSaved,
  onError,
}: {
  kriteria: Kriteria;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [bobot, setBobot] = useState(String(kriteria.bobot));
  const [jenis, setJenis] = useState(kriteria.jenis);
  const [preferenceFunction, setPreferenceFunction] = useState(kriteria.preferenceFunction);
  const [parameterP, setParameterP] = useState(kriteria.parameterP != null ? String(kriteria.parameterP) : '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/kriteria/${kriteria.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: kriteria.nama,
        jenis,
        bobot: Number(bobot),
        preferenceFunction,
        parameterP: preferenceFunction === 'linear' ? Number(parameterP) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      onError(body.error ?? 'Gagal menyimpan kriteria');
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold">
          Edit {kriteria.kode} - {kriteria.nama}
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Jenis</label>
          <select value={jenis} onChange={(e) => setJenis(e.target.value as 'benefit' | 'cost')} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="benefit">Benefit</option>
            <option value="cost">Cost</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Bobot</label>
          <input value={bobot} onChange={(e) => setBobot(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fungsi Preferensi</label>
          <select
            value={preferenceFunction}
            onChange={(e) => setPreferenceFunction(e.target.value as 'usual' | 'linear')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="usual">Tipe I - Usual</option>
            <option value="linear">Tipe III - Linear</option>
          </select>
        </div>
        {preferenceFunction === 'linear' && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Parameter p</label>
            <input value={parameterP} onChange={(e) => setParameterP(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">
            Batal
          </button>
          <button type="submit" disabled={saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Open `http://localhost:3000/kriteria`. Confirm 5 rows with bobot 0.133333 / 0.333333 / 0.266667 / 0.200000 / 0.066667 matching BAB 3.3 of the report. Edit C1's bobot, save, and confirm it persists after a page refresh.

- [ ] **Step 4: Commit**

```bash
git add app/kriteria
git commit -m "feat: add Data Kriteria page"
```

---

## Task 14: Data Penilaian Page + Detail + Import

**Files:**
- Create: `app/penilaian/page.tsx`
- Create: `app/penilaian/PenilaianManager.tsx`
- Create: `app/penilaian/ImportButton.tsx`
- Create: `app/penilaian/[id]/page.tsx`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`; `PenilaianRow` from `@/lib/types`; API routes from Task 8.

- [ ] **Step 1: Write `app/penilaian/page.tsx`**

```tsx
import { getDb } from '@/lib/db';
import { PenilaianManager } from './PenilaianManager';
import type { PenilaianRow } from '@/lib/types';

export default function PenilaianPage() {
  const db = getDb();
  const mahasiswaRows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
  const penilaianRows = db
    .prepare(
      `SELECT p.mahasiswa_id as mahasiswaId, k.kode as kode, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id`
    )
    .all() as { mahasiswaId: number; kode: string; nilai: number }[];

  const nilaiByMahasiswa = new Map<number, Record<string, number>>();
  for (const row of penilaianRows) {
    if (!nilaiByMahasiswa.has(row.mahasiswaId)) nilaiByMahasiswa.set(row.mahasiswaId, {});
    nilaiByMahasiswa.get(row.mahasiswaId)![row.kode] = row.nilai;
  }

  const data: PenilaianRow[] = mahasiswaRows.map((m) => ({
    mahasiswaId: m.id,
    altCode: m.alt_code,
    nim: m.nim,
    nama: m.nama,
    nilai: nilaiByMahasiswa.get(m.id) ?? {},
  }));

  return <PenilaianManager initialData={data} />;
}
```

- [ ] **Step 2: Write `app/penilaian/ImportButton.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';

export function ImportButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Mengimpor...');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/penilaian/import', { method: 'POST', body: formData });
    const body = await res.json();

    if (!res.ok) {
      setStatus(null);
      setError(body.error ?? 'Gagal mengimpor file');
      return;
    }

    setStatus(`Impor selesai: ${body.created} data baru, ${body.updated} data diperbarui.`);
    if (inputRef.current) inputRef.current.value = '';
    onImported();
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Import Excel
        <input ref={inputRef} type="file" accept=".xlsx" onChange={handleChange} className="hidden" />
      </label>
      {status && <span className="text-sm text-green-700">{status}</span>}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Write `app/penilaian/PenilaianManager.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PenilaianRow } from '@/lib/types';
import { ImportButton } from './ImportButton';

const PAGE_SIZE = 20;
const KRITERIA_KODE = ['C1', 'C2', 'C3', 'C4', 'C5'] as const;

export function PenilaianManager({ initialData }: { initialData: PenilaianRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return initialData;
    return initialData.filter((r) => r.nim.toLowerCase().includes(term) || r.nama.toLowerCase().includes(term));
  }, [initialData, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Penilaian</h1>
        <ImportButton onImported={() => router.refresh()} />
      </div>

      <input
        type="text"
        placeholder="Cari NIM atau nama..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Alt.</th>
              <th className="px-4 py-2">NIM</th>
              <th className="px-4 py-2">Nama</th>
              {KRITERIA_KODE.map((k) => (
                <th key={k} className="px-4 py-2">
                  {k}
                </th>
              ))}
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.mahasiswaId} className="border-t border-slate-100">
                <td className="px-4 py-2">{r.altCode}</td>
                <td className="px-4 py-2">{r.nim}</td>
                <td className="px-4 py-2">{r.nama}</td>
                {KRITERIA_KODE.map((k) => (
                  <td key={k} className="px-4 py-2 font-mono">
                    {r.nilai[k] ?? '-'}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <Link href={`/penilaian/${r.mahasiswaId}`} className="text-slate-600 hover:underline">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Menampilkan {pageRows.length} dari {filtered.length} mahasiswa
        </span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
            Sebelumnya
          </button>
          <span>
            Hal {page}/{totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `app/penilaian/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';

export default function DetailPenilaianPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const mahasiswa = db.prepare('SELECT * FROM mahasiswa WHERE id = ?').get(params.id) as any;
  if (!mahasiswa) notFound();

  const nilaiRows = db
    .prepare(
      `SELECT k.kode as kode, k.nama as nama, k.jenis as jenis, p.nilai as nilai
       FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id
       WHERE p.mahasiswa_id = ?
       ORDER BY k.kode`
    )
    .all(params.id) as { kode: string; nama: string; jenis: string; nilai: number }[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Detail Penilaian</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p>
          <span className="text-slate-500">NIM:</span> {mahasiswa.nim}
        </p>
        <p>
          <span className="text-slate-500">Nama:</span> {mahasiswa.nama}
        </p>
        <p>
          <span className="text-slate-500">Program Studi:</span> {mahasiswa.program_studi}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2">Kode</th>
              <th className="px-4 py-2">Kriteria</th>
              <th className="px-4 py-2">Jenis</th>
              <th className="px-4 py-2">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {nilaiRows.map((n) => (
              <tr key={n.kode} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium">{n.kode}</td>
                <td className="px-4 py-2">{n.nama}</td>
                <td className="px-4 py-2 capitalize">{n.jenis}</td>
                <td className="px-4 py-2 font-mono">{n.nilai}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

Open `http://localhost:3000/penilaian`. Confirm 254 rows with C1-C5 columns; spot-check A1: C1≈99.134199, C5=3.94. Click "Detail" for A1 and confirm the same values appear. Click "Import Excel" and re-upload `dataset_promethee.xlsx`'s matrix sheet (export it once via Task 3's `parseMatriksKeputusan` or reuse the original file) — confirm the status message reports 254 "data diperbarui" (all NIMs already exist).

- [ ] **Step 6: Commit**

```bash
git add app/penilaian
git commit -m "feat: add Data Penilaian page with detail view and Excel import"
```

---

## Task 15: Proses PROMETHEE Page

**Files:**
- Create: `app/proses/page.tsx`

**Interfaces:**
- Consumes: `POST /api/proses` from Task 9.

- [ ] **Step 1: Write `app/proses/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TAHAPAN = [
  'Pemeriksaan data mahasiswa',
  'Pemeriksaan data kriteria',
  'Bobot kriteria',
  'Preference Function',
  'Preference Index',
  'Leaving Flow',
  'Entering Flow',
  'Net Flow',
];

export default function ProsesPage() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ alternatifCount: number; durationMs: number; processedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    const res = await fetch('/api/proses', { method: 'POST' });
    const body = await res.json();
    setRunning(false);
    if (!res.ok) {
      setError(body.error ?? 'Proses PROMETHEE gagal');
      return;
    }
    setResult(body);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Proses PROMETHEE</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <ol className="space-y-2 text-sm text-slate-600">
          {TAHAPAN.map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs text-white ${
                  result ? 'bg-green-600' : running ? 'bg-slate-400' : 'bg-slate-300'
                }`}
              >
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && (
        <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Proses selesai untuk {result.alternatifCount} alternatif dalam {result.durationMs} ms. Diproses pada{' '}
          {new Date(result.processedAt).toLocaleString('id-ID')}.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRun}
          disabled={running}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {running ? 'Memproses...' : 'Jalankan Proses'}
        </button>
        {result && (
          <a href="/ranking" className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Lihat Hasil Ranking
          </a>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Open `http://localhost:3000/proses` (after `npm run seed`). Click "Jalankan Proses". Confirm a success message shows `254 alternatif` and a duration in ms, and the Dashboard's "Status Proses PROMETHEE" updates after navigating back to `/`.

- [ ] **Step 3: Commit**

```bash
git add app/proses
git commit -m "feat: add Proses PROMETHEE page"
```

---

## Task 16: Hasil Ranking Page

**Files:**
- Create: `app/ranking/page.tsx`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`.

- [ ] **Step 1: Write `app/ranking/page.tsx`**

```tsx
import { getDb } from '@/lib/db';

export default function RankingPage() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.alt_code as altCode, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all() as { ranking: number; altCode: string; nim: string; nama: string; leavingFlow: number; enteringFlow: number; netFlow: number }[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hasil Ranking</h1>
        <span className="text-sm text-slate-500">{rows.length} mahasiswa</span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">Belum ada hasil. Jalankan Proses PROMETHEE terlebih dahulu.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Peringkat</th>
                <th className="px-4 py-2">NIM</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Leaving Flow</th>
                <th className="px-4 py-2">Entering Flow</th>
                <th className="px-4 py-2">Net Flow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.altCode} className={`border-t border-slate-100 ${r.ranking <= 3 ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-2 font-semibold">#{r.ranking}</td>
                  <td className="px-4 py-2">{r.nim}</td>
                  <td className="px-4 py-2">{r.nama}</td>
                  <td className="px-4 py-2 font-mono">{r.leavingFlow.toFixed(6)}</td>
                  <td className="px-4 py-2 font-mono">{r.enteringFlow.toFixed(6)}</td>
                  <td className="px-4 py-2 font-mono">{r.netFlow.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

After running Proses PROMETHEE, open `http://localhost:3000/ranking`. Confirm 254 rows render; rank #1 is "Irvan Topa"... actually "Muhammad Syeh Pullah" with net flow ≈0.458995 (highlighted amber as top-3); scroll to the bottom and confirm the last row is "JASSEN NIHAUW" with net flow ≈-0.959187, matching Lampiran A of the report.

- [ ] **Step 3: Commit**

```bash
git add app/ranking
git commit -m "feat: add Hasil Ranking page"
```

---

## Task 17: Laporan Page + Preview + Print + Export

**Files:**
- Create: `app/laporan/page.tsx`
- Create: `app/laporan/preview/[type]/page.tsx`
- Create: `app/laporan/preview/[type]/PrintButton.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `getDb` from `@/lib/db`; `GET /api/laporan/export/excel` from Task 10.

- [ ] **Step 1: Write `app/laporan/page.tsx`**

```tsx
import Link from 'next/link';

const JENIS_LAPORAN = [
  { key: 'mahasiswa', label: 'Data Mahasiswa' },
  { key: 'kriteria', label: 'Data Kriteria' },
  { key: 'penilaian', label: 'Data Penilaian' },
  { key: 'ranking', label: 'Hasil Ranking PROMETHEE' },
];

export default function LaporanPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Laporan</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {JENIS_LAPORAN.map((j) => (
          <div key={j.key} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-900">{j.label}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/laporan/preview/${j.key}`} className="rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                Preview
              </Link>
              {j.key === 'ranking' && (
                <a href="/api/laporan/export/excel" className="rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  Export Excel
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/laporan/preview/[type]/PrintButton.tsx`**

```tsx
'use client';

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="print:hidden rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
      Cetak / Simpan PDF
    </button>
  );
}
```

- [ ] **Step 3: Write `app/laporan/preview/[type]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { PrintButton } from './PrintButton';

const VALID_TYPES = ['mahasiswa', 'kriteria', 'penilaian', 'ranking'] as const;
type LaporanType = (typeof VALID_TYPES)[number];

export default function PreviewLaporanPage({ params }: { params: { type: string } }) {
  if (!VALID_TYPES.includes(params.type as LaporanType)) notFound();
  const type = params.type as LaporanType;
  const db = getDb();
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="print:hidden flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Preview Laporan</h1>
        <PrintButton />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 print:border-0 print:p-0">
        <h2 className="text-center text-lg font-semibold">Laporan {labelFor(type)}</h2>
        <p className="text-center text-sm text-slate-500">Tanggal cetak: {tanggal}</p>
        <div className="mt-4">{renderTable(type, db)}</div>
      </div>
    </div>
  );
}

function labelFor(type: LaporanType): string {
  return {
    mahasiswa: 'Data Mahasiswa',
    kriteria: 'Data Kriteria',
    penilaian: 'Data Penilaian',
    ranking: 'Hasil Ranking PROMETHEE',
  }[type];
}

function renderTable(type: LaporanType, db: ReturnType<typeof getDb>) {
  if (type === 'mahasiswa') {
    const rows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Alt.</th>
            <th className="border px-2 py-1">NIM</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">Program Studi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="border px-2 py-1">{r.alt_code}</td>
              <td className="border px-2 py-1">{r.nim}</td>
              <td className="border px-2 py-1">{r.nama}</td>
              <td className="border px-2 py-1">{r.program_studi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'kriteria') {
    const rows = db.prepare('SELECT * FROM kriteria ORDER BY kode').all() as any[];
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Kode</th>
            <th className="border px-2 py-1">Kriteria</th>
            <th className="border px-2 py-1">Jenis</th>
            <th className="border px-2 py-1">Bobot</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="border px-2 py-1">{r.kode}</td>
              <td className="border px-2 py-1">{r.nama}</td>
              <td className="border px-2 py-1 capitalize">{r.jenis}</td>
              <td className="border px-2 py-1 font-mono">{Number(r.bobot).toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'penilaian') {
    const mahasiswaRows = db.prepare('SELECT * FROM mahasiswa ORDER BY CAST(SUBSTR(alt_code, 2) AS INTEGER)').all() as any[];
    const penilaianRows = db
      .prepare(
        `SELECT p.mahasiswa_id as mahasiswaId, k.kode as kode, p.nilai as nilai
         FROM penilaian p JOIN kriteria k ON k.id = p.kriteria_id`
      )
      .all() as { mahasiswaId: number; kode: string; nilai: number }[];
    const nilaiByMahasiswa = new Map<number, Record<string, number>>();
    for (const row of penilaianRows) {
      if (!nilaiByMahasiswa.has(row.mahasiswaId)) nilaiByMahasiswa.set(row.mahasiswaId, {});
      nilaiByMahasiswa.get(row.mahasiswaId)![row.kode] = row.nilai;
    }
    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">NIM</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">C1</th>
            <th className="border px-2 py-1">C2</th>
            <th className="border px-2 py-1">C3</th>
            <th className="border px-2 py-1">C4</th>
            <th className="border px-2 py-1">C5</th>
          </tr>
        </thead>
        <tbody>
          {mahasiswaRows.map((m) => {
            const nilai = nilaiByMahasiswa.get(m.id) ?? {};
            return (
              <tr key={m.id}>
                <td className="border px-2 py-1">{m.nim}</td>
                <td className="border px-2 py-1">{m.nama}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C1 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C2 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C3 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C4 ?? '-'}</td>
                <td className="border px-2 py-1 font-mono">{nilai.C5 ?? '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  const rows = db
    .prepare(
      `SELECT h.ranking as ranking, m.nim as nim, m.nama as nama,
              h.leaving_flow as leavingFlow, h.entering_flow as enteringFlow, h.net_flow as netFlow
       FROM hasil_ranking h JOIN mahasiswa m ON m.id = h.mahasiswa_id
       ORDER BY h.ranking ASC, m.alt_code ASC`
    )
    .all() as { ranking: number; nim: string; nama: string; leavingFlow: number; enteringFlow: number; netFlow: number }[];
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr>
          <th className="border px-2 py-1">Peringkat</th>
          <th className="border px-2 py-1">NIM</th>
          <th className="border px-2 py-1">Nama</th>
          <th className="border px-2 py-1">Leaving</th>
          <th className="border px-2 py-1">Entering</th>
          <th className="border px-2 py-1">Net Flow</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.nim}>
            <td className="border px-2 py-1">{r.ranking}</td>
            <td className="border px-2 py-1">{r.nim}</td>
            <td className="border px-2 py-1">{r.nama}</td>
            <td className="border px-2 py-1 font-mono">{r.leavingFlow.toFixed(6)}</td>
            <td className="border px-2 py-1 font-mono">{r.enteringFlow.toFixed(6)}</td>
            <td className="border px-2 py-1 font-mono">{r.netFlow.toFixed(6)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Append print rules to `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@media print {
  body {
    background: white;
  }
  nav {
    display: none;
  }
}
```

- [ ] **Step 5: Manual verification**

Open `http://localhost:3000/laporan`. Click "Preview" on "Hasil Ranking PROMETHEE" (after Proses PROMETHEE has run) — confirm a print-friendly table with 254 rows and no sidebar. Click "Cetak / Simpan PDF" and confirm the browser's print dialog opens with the sidebar hidden in the print preview. Go back to `/laporan` and click "Export Excel" — confirm a `Ranking_PROMETHEE.xlsx` file downloads with 254 data rows matching the report's Lampiran A.

- [ ] **Step 6: Run the full test suite**

Run: `npm run test`
Expected: all tests across `lib/` and `app/api/**` pass.

- [ ] **Step 7: Commit**

```bash
git add app/laporan app/globals.css
git commit -m "feat: add Laporan page with print-friendly preview and Excel export"
```

---

## Final Verification

- [ ] Run `npm run build` once more to confirm the full app (all 7 pages + API routes) compiles cleanly.
- [ ] Run `npm run test` to confirm all automated tests (DB schema, Excel parsing, PROMETHEE engine regression, all API routes) pass.
- [ ] With `npm run dev` running and the database seeded, walk through: Dashboard → Data Mahasiswa (search/add/edit/delete) → Data Kriteria (edit bobot) → Data Penilaian (detail + import) → Proses PROMETHEE (run) → Hasil Ranking (confirm #1 is Muhammad Syeh Pullah, #254 is JASSEN NIHAUW) → Laporan (preview all 4 types, print, export Excel).
