// Gateway SQLite DB — owns accounts, ledger, payees, billers, equities (SPEC §6).
// Separate DB file from the web app (SPEC §4). Web app's sessions live elsewhere.
import BetterSqlite3 from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "gateway.db");

export type DB = BetterSqlite3.Database;

export function openDb(): DB {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new BetterSqlite3(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      kyc_status  TEXT NOT NULL CHECK (kyc_status IN ('VERIFIED','PENDING','REJECTED'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id),
      name       TEXT NOT NULL,
      type       TEXT NOT NULL CHECK (type IN ('SAVINGS','CURRENT','JOINT','BROKERAGE')),
      currency   TEXT NOT NULL,
      balance    REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id            TEXT PRIMARY KEY,
      ts            TEXT NOT NULL,
      account_id    TEXT NOT NULL REFERENCES accounts(id),
      delta         REAL NOT NULL,
      balance_after REAL NOT NULL,
      ref           TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS payees (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id),
      display_name   TEXT NOT NULL,
      masked_account TEXT NOT NULL,
      reference      TEXT NOT NULL DEFAULT '',
      added_at       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS billers (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      bill_account_ref TEXT NOT NULL,
      amount_due       REAL NOT NULL,
      currency         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS equities (
      ticker   TEXT PRIMARY KEY,
      exchange TEXT NOT NULL,
      currency TEXT NOT NULL,
      price    REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fx_rates (
      pair  TEXT PRIMARY KEY,
      rate  REAL NOT NULL
    );
  `);
}
