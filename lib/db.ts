import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// Vite's (and therefore Vitest's) static import analysis does not yet
// recognize 'node:sqlite' as a builtin on this toolchain version, so a
// static `import { DatabaseSync } from 'node:sqlite'` fails to resolve
// under `vitest run` even though Node itself has the module. Loading it
// through Node's own `require` (via createRequire) bypasses Vite's import
// analysis entirely and resolves correctly in both `next dev`/`next build`
// and `vitest run`.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire('node:sqlite') as typeof import('node:sqlite');

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

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface PreparedStatement {
  run(...params: any[]): RunResult;
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

// Thin compatibility wrapper so the rest of the codebase can call
// db.prepare(...).run/get/all(...), db.exec(...), db.pragma(...) and
// db.transaction(fn) exactly as it would against better-sqlite3 — see the
// ledger ruling in .superpowers/sdd/2026-10-12-spk-promethee/progress.md
// for why node:sqlite's DatabaseSync is used instead.
export interface Db {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
  pragma(sql: string): void;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}

function wrap(raw: DatabaseSync): Db {
  return {
    prepare(sql: string): PreparedStatement {
      const stmt = raw.prepare(sql);
      return {
        run: (...params: any[]) => stmt.run(...params) as unknown as RunResult,
        get: (...params: any[]) => stmt.get(...params),
        all: (...params: any[]) => stmt.all(...params),
      };
    },
    exec(sql: string) {
      raw.exec(sql);
    },
    pragma(sql: string) {
      raw.exec(`PRAGMA ${sql}`);
    },
    transaction<T extends (...args: any[]) => any>(fn: T): T {
      return ((...args: any[]) => {
        raw.exec('BEGIN');
        try {
          const result = fn(...args);
          raw.exec('COMMIT');
          return result;
        } catch (err) {
          raw.exec('ROLLBACK');
          throw err;
        }
      }) as T;
    },
    close() {
      raw.close();
    },
  };
}

export function createDb(dbPath: string): Db {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  const raw = new DatabaseSync(dbPath);
  raw.exec('PRAGMA journal_mode = WAL');
  raw.exec('PRAGMA foreign_keys = ON');
  raw.exec(SCHEMA);
  return wrap(raw);
}

let singleton: Db | null = null;

export function getDb(dbPath?: string): Db {
  if (!singleton) singleton = createDb(dbPath ?? DEFAULT_DB_PATH);
  return singleton;
}

export function resetDbSingleton(): void {
  if (singleton) singleton.close();
  singleton = null;
}
