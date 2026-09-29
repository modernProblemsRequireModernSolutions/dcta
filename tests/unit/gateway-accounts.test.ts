// Prompt 1 "Done when": GET /accounts on the gateway returns the seeded balances.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { openDb } from "../../services/gateway/src/db.js";
import { seed } from "../../services/gateway/src/seed.js";
import type { Server } from "node:http";
import type { DB } from "../../services/gateway/src/db.js";

let app: express.Express;
let server: Server;
let db: DB;
const PORT = 4011;

beforeAll(() => {
  db = openDb();
  seed(db);
  app = express();
  app.get("/accounts", (_req, res) => {
    const rows = db
      .prepare("SELECT id, user_id, name, type, currency, balance FROM accounts ORDER BY id")
      .all();
    res.json(rows);
  });
  return new Promise<void>((resolve) => {
    server = app.listen(PORT, resolve);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
});

describe("gateway GET /accounts", () => {
  it("returns the four seeded accounts with correct balances (SPEC §6)", async () => {
    const res = await fetch(`http://localhost:${PORT}/accounts`);
    expect(res.ok).toBe(true);
    const accounts = (await res.json()) as Array<{
      id: string;
      name: string;
      currency: string;
      balance: number;
    }>;

    const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));
    expect(byId.acc_sav_001.balance).toBe(12400.0);
    expect(byId.acc_cur_001.balance).toBe(3150.0);
    expect(byId.acc_jnt_001.balance).toBe(8000.0);
    expect(byId.acc_brk_001.balance).toBe(1200.0);
    expect(accounts.every((a) => a.currency === "SGD")).toBe(true);
  });
});
