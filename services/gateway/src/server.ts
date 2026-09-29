// Execution Gateway — trusted zone (SPEC §2, §3).
// Separate Express process, port 4001, own SQLite DB + secret.
//
// IMPORTANT (SPEC §2 rule 1): the web app's server code has NO client that calls
// /execute. Only the browser calls /execute, after biometric signing. The execute
// + WebAuthn endpoints land in Prompt 6; Prompt 1 exposes only read-only data.
import express from "express";
import cors from "cors";
import { openDb } from "./db.js";
import { seed } from "./seed.js";

const PORT = Number(process.env.GATEWAY_PORT ?? 4001);
const db = openDb();

// Auto-seed on first start so `npm run dev` alone gives seeded balances (Prompt 1 Done-when).
const { accounts, payees } = seed(db);
console.log(`[gateway] DB ready: ${accounts} accounts, ${payees} payees.`);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── Read-only endpoints (used by the web app for lookup) ────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, service: "dcta-gateway" }));

// SPEC §6 accounts with balances.
app.get("/accounts", (_req, res) => {
  const rows = db.prepare(
    "SELECT id, user_id, name, type, currency, balance FROM accounts ORDER BY id",
  ).all();
  res.json(rows);
});

app.get("/payees", (_req, res) => {
  const rows = db.prepare(
    "SELECT id, user_id, display_name, masked_account, reference, added_at FROM payees ORDER BY id",
  ).all();
  res.json(rows);
});

app.get("/billers", (_req, res) => {
  const rows = db.prepare(
    "SELECT id, name, bill_account_ref, amount_due, currency FROM billers ORDER BY id",
  ).all();
  res.json(rows);
});

app.get("/equities", (_req, res) => {
  const rows = db.prepare(
    "SELECT ticker, exchange, currency, price FROM equities ORDER BY ticker",
  ).all();
  res.json(rows);
});

app.get("/users", (_req, res) => {
  const rows = db.prepare("SELECT id, name, kyc_status FROM users ORDER BY id").all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`[gateway] Execution Gateway listening on http://localhost:${PORT}`);
});
