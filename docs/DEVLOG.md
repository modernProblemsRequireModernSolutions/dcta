# DCTA — Development Log

Chronological log of work done per prompt. Newest at the top.

## 2026-10-13 — Submission preparation + GitHub Pages UI demo
**Scope:** consolidate project context, safely reconcile Git histories, create a public static UI demo from the same repository, and prepare the hackathon submission form assets.

- Safely merged the separately recreated remote Prompt 1 history into the complete local Prompt 0–2 branch; no force push.
- Added `docs/PROJECT_CONTEXT.md` as the consolidated handoff for the project-owner instructions, source-of-truth links, prompt sequence, hosting context and submission fields. Canonical prompt blocks remain in `docs/PROMPTS.md` to avoid divergent copies.
- Added a GitHub Pages-compatible static demo in `docs/index.html`, `docs/styles.css` and `docs/app.js`:
  - mobile red/white chat UI;
  - credential-free deterministic handling of the four specified test phrases;
  - one-tap John Doe / John Smith clarification;
  - browser Web Speech input when supported;
  - suspicious-instruction blocking;
  - clear draft-only/no-real-money disclosure.
- Advanced the Next.js Prompt 3 UI with `components/chat/ChatScreen.tsx`, `DraftCard.tsx`, and a chat-first `app/page.tsx`.
- Added `docs/SUBMISSION.md` with copy for every form field shown in the supplied screenshot, a 5–8 minute video outline, conversation-history screenshot checklist, bonus social-post copy and final checklist.
- Added `docs/assets/dcta-cover-3840x2160.png`: 3840×2160, 16:9, 488 KB, no DBS logo.
- Hosting note: GitHub Pages can host the static UI demo but cannot host the full Next.js API + Express/SQLite/WebAuthn architecture. The static page performs no execution; the repository retains the two-service architecture.
- **Verification:** all 5 Vitest tests passed; full shared/gateway/Next.js production build passed; browser smoke test passed from initial screen → sample request → both draft cards → one-tap John Doe resolution; static assets and JavaScript syntax passed.
- **Dependency review:** `npm audit fix` applied compatible updates. The legacy Next.js 14/Tailwind 3/Vitest 2 stack still reports advisories whose automated remediation requires breaking major upgrades; the published GitHub Pages demo is dependency-free static HTML/CSS/JS and does not expose the Next.js server. Major framework upgrades remain follow-up work before deploying the server application.
- **Pending exit checks:** GitHub push, Pages enablement and public-URL smoke test.

## 2026-09-30 — Prompt 2: Intent parser (text first)
**Phase:** Day 3 (intent parser, text input). **Exit check (SPEC §10):** intent parser built with text input. **Done when:** tests pass and test 2 returns `NEEDS_CLARIFICATION` with both Johns as options.

- Built the Intent Parser in `apps/web`:
  - `lib/intentParser.ts` — core parser: LLM call → zod-validate (retry once on failure) → deterministic resolution → build full `TransactionDraft` (§5 schema) → validate.
  - `lib/numberWords.ts` — converts spoken amount expressions ("fifty", "five hundred dollars", "a grand") to numbers in code. Handles slang (grand, k) and currency words.
  - `lib/lookup.ts` — deterministic fuzzy lookup against seeded data. Resolves payees/billers/accounts/equities by name; detects ambiguity (e.g. "John" → John Doe + John Smith) and returns clarification options instead of guessing (SPEC §2 rule 6). The LLM never invents IDs.
  - `lib/resolveDependsOn.ts` — resolves "whatever is left" / "half of it" formulas deterministically in TypeScript using actual account balances, never by the LLM (SPEC §5).
  - `lib/llmClient.ts` — OpenAI-compatible client from env (`LLM_BASE_URL`/`LLM_API_KEY`/`LLM_MODEL`), JSON-mode, temperature 0.
  - `lib/gatewayData.ts` — fetches payees/billers/accounts/equities from the gateway read endpoints.
  - `lib/sessionStore.ts` — in-memory session store keyed by `session_id`.
  - `lib/auditStub.ts` — simple audit stub (real hash-chained log in Prompt 7).
  - `app/api/parse/route.ts` — `POST /api/parse { session_id, text } → { drafts[] }`.
- System prompt wraps user input in `<user_input>…</user_input>` delimiters and instructs the LLM to treat it as untrusted data (SPEC §2 rule 7). Outputs JSON only; splits multi-intent; fills `amount_expression` + `source_span` verbatim; sets `NEEDS_CLARIFICATION` instead of guessing.
- Parser designed with injectable deps (LLM fn + lookup data) so tests are deterministic — no API key or gateway needed.
- **Vitest tests** (`tests/unit/intentParser.test.ts`) for all 4 PROMPTS.md inputs using a fake LLM + injected seed data:
  1. Multi-intent (transfer + equity) → `depends_on` "whatever is left" resolved to 11900 (12400 − 500) in TS ✅
  2. Ambiguous John → `NEEDS_CLARIFICATION` with both John Doe ••4521 and John Smith ••8892 as options ✅
  3. "a grand" = 1000, "half of it" = 500 ✅
  4. Ah Boy resolved uniquely, "makan lah" kept as reference ✅
- Full suite: 5 tests pass (4 intent parser + 1 gateway accounts from Prompt 1).
- **"Done when" check:** tests pass and test 2 returns `NEEDS_CLARIFICATION` with both Johns as options. ✅
- **Next:** Prompt 3 (chat UI + clarification loop, Day 4).

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