# DCTA — Development Log

Chronological log of work done per prompt. Newest at the top.

## 2026-09-30 — Prompt 1: Scaffold + seed data
**Phase:** Days 1–2 (Architecture + scaffold). **Exit check:** both services start; `GET /accounts` on the gateway returns seeded balances.

- Scaffolded the monorepo:
  - Root workspace `package.json` (npm workspaces); one `npm run dev` runs gateway + web via `concurrently`.
  - `packages/shared`: zod schemas + TS types for the Transaction Draft (SPEC §5), plus `canonicalJson` for tamper-evident hashing (used by the WebAuthn challenge in Prompt 6).
  - `services/gateway`: Express + TS on `:4001`, own SQLite DB (`better-sqlite3`), separate `data/gateway.db`. Read-only endpoints: `/health`, `/accounts`, `/payees`, `/billers`, `/equities`, `/users`. Auto-seeds on first start.
  - `apps/web`: Next.js 14 App Router + TS + Tailwind (DBS-like red/white, mobile-first, no real logo). Placeholder home screen renders accounts from the gateway. `transpilePackages: ["@dcta/shared"]`.
- Seed script (`npm run seed`) loads all SPEC §6 data: 2 users (Wei Jun Tan VERIFIED / Test Pending PENDING), 4 accounts, 5 payees (incl. deliberate John ambiguity + the injection-payload payee `pay_refund`), 3 billers, 3 equities, SGD/USD FX.
- `.env.example` with `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `TENCENT_SECRET_ID`, `TENCENT_SECRET_KEY`, `GATEWAY_URL`, `GATEWAY_SHARED_READ_KEY`.
- README "Getting started" section.
- **Verification:** `npm install` ok; gateway boots; `GET /accounts` returns Savings S$12,400 / Current S$3,150 / Joint S$8,000 / Brokerage S$1,200; `/payees` shows the injection reference; Vitest `gateway-accounts.test.ts` passes.
- **"Done when" check (Prompt 1):** both services start and `GET /accounts` returns seeded balances. ✅
- **Security note:** the web app exposes **no** `/execute` route by design (SPEC §2 rule 1); the execute + WebAuthn endpoints arrive in Prompt 6.
- **Next:** Prompt 2 (intent parser, text first).

## 2026-09-29 — Prompt 0: Plan (no code)
**Phase:** Days 1–2 (Architecture + scaffold). **Exit check:** plan agreed, both services run, `GET /accounts` shows seeded balances.

- Cloned `modernProblemsRequireModernSolutions/dcta`; read `docs/SPEC.md` (source of truth) and `docs/PROMPTS.md`.
- Wrote `docs/PLAN.md`: restated SPEC §2 non-negotiable rules in my own words, proposed the monorepo folder structure, confirmed the Days 1–16 build plan with deliverables + exit checks, listed risks/questions.
- Created `docs/PROMPT_CATALOG.md` to track all 11 prompts (0–10) by status + "Done when".
- **"Done when" check (Prompt 0):** plan matches spec and does **not** let the agent call the gateway `/execute` — only the browser does, after WebAuthn. ✅
- **Flags:** SPEC has no §11 yet (standing rules reference it) — noted, no conflict. Real Tencent ASR creds + deployed domain (for RP ID) need confirming before Prompt 4 / Prompt 10.
- **Next:** Prompt 1 (scaffold + seed). Nothing to run locally for Prompt 0 (plan-only).