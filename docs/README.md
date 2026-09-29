# DCTA — Direct Conversational Transaction Agent

**Tencent Cloud AI Hackathon 2026 · Banking Track (DBS) · Submission due 16 Oct 2026.**

> *"Speak your banking; AI drafts it, only you sign it."*

DCTA is a voice personal banker prototype. The user speaks or types a multi-part
request, an AI agent turns it into structured **transaction drafts** (never executes
them), an independent validator checks each draft against the transcript, and a
fixed confirmation screen is signed with device biometrics (WebAuthn). Only signed
drafts are executed by a separate, mock **Execution Gateway**. Every step goes into
a tamper-evident audit log.

See `docs/SPEC.md` for the full spec (source of truth) and `docs/PROMPTS.md` for the
prompt-by-prompt build plan.

## Architecture (zero-trust core)

- **Agent (`apps/web`)** — untrusted zone. LLM only creates drafts; it has **no
  credentials and no code path** to the gateway's execute endpoint.
- **Gateway (`services/gateway`)** — trusted zone, separate process/port/DB/secret.
  Accepts a request only with a valid WebAuthn assertion whose
  `challenge = SHA-256(canonical_json(draft) + nonce)`.

## Getting started

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10

### Install
```bash
npm install
```

### Configure
```bash
cp .env.example .env
# fill in LLM_* for intent parsing; Tencent creds are optional (Web Speech fallback)
```

### Run both services in dev (one command)
```bash
npm run dev
```
This starts:
- **Gateway** on http://localhost:4001 (Express + TypeScript, own SQLite DB)
- **Web** on http://localhost:3000 (Next.js 14 App Router)

The gateway auto-seeds its mock data on first start.

### Seed / reset mock data
```bash
npm run seed
```

### Verify the gateway
```bash
curl http://localhost:4001/accounts
```
Should return the seeded accounts (Savings S$12,400, Current S$3,150, Joint S$8,000, Brokerage S$1,200).

### Tests
```bash
npm test
```

## Monorepo layout
```
apps/web/            Next.js 14 — untrusted agent zone (no /execute route, by design)
services/gateway/    Express :4001 — trusted execution zone (own SQLite DB)
packages/shared/     zod schemas + TS types for the Transaction Draft (SPEC §5)
tests/               Vitest unit / e2e / red-team
docs/                SPEC, PROMPTS, PLAN, DEVLOG, PROMPT_CATALOG, METRICS, ARCHITECTURE
```

## Status
See `docs/PROMPT_CATALOG.md` for prompt-by-prompt progress and `docs/DEVLOG.md` for the dev log.
