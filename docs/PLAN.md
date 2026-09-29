# DCTA — Prompt 0: Plan (no code yet)

> Phase: **Days 1–2 (29–30 Sep 2026) — Architecture + scaffold.** Exit check: plan agreed, both services run, `GET /accounts` on the gateway returns seeded balances.

## 1. Non-negotiable security rules (SPEC §2, in my words)

The whole design is: *the AI only writes drafts, the confirmation screen signs them, and a separate mock gateway only accepts signed requests.*

1. **Draft-only agent.** The LLM/agent produces drafts and nothing else. It has **no credentials and no code path** to the gateway's `/execute` — it cannot move money.
2. **Separate, credentialed gateway.** The Execution Gateway is its own process/port/DB/secret. It accepts a request only with a valid WebAuthn assertion whose `challenge = SHA-256(canonical_json(draft) + nonce)` — so the signature is bound to the exact amount, payee and account the user saw.
3. **Single-use, 120s nonce.** Each nonce is one-shot and expires fast; old signed requests can't be replayed.
4. **Fixed confirmation screen.** The confirm UI is rendered purely from the draft JSON by deterministic components. No LLM text/HTML on that screen.
5. **Validator freezes on mismatch.** Any disagreement between transcript and draft sets status `FROZEN` with the reason; it can't be signed until fixed.
6. **Never guess — ask.** Ambiguous payee / unclear amount / missing account → a short multiple-choice question, not an assumption.
7. **Untrusted text is data, never instructions.** Names, refs and transcripts are wrapped in delimiters and labelled untrusted in every prompt.
8. **Gateway re-checks risk itself.** Limits, velocity, KYC run in the gateway no matter what the agent claims.
9. **Hash-chained audit of everything.** Raw input, transcript, each draft version, validator result, clarifications, signature and gateway decision all go in the append-only log.

## 2. Folder structure

```
dcta/
├─ apps/web/                 # Next.js 14 App Router + TS + Tailwind  — UNTRUSTED zone
│  ├─ app/{page(chat), confirm, audit, onboarding}/page.tsx
│  ├─ app/api/{parse,asr,clarify}/route.ts   # NOTE: NO /execute route here — by design
│  ├─ lib/{intentParser,clarifier,validator,injectionShield,auditClient,lookup}.ts
│  └─ data/web.db            # sessions + payee/biller lookup mirror
├─ services/gateway/         # Express + TS, :4001 — TRUSTED zone
│  ├─ src/{server,webauthn,risk,ledger,audit,nonce}.ts
│  └─ data/gateway.db        # accounts, ledger, nonces, passkeys, audit (own DB)
├─ packages/shared/          # zod schemas + TS types: TransactionDraft (§5), canonicalJson
├─ tests/{unit,e2e,redteam}  # Vitest
├─ docs/                     # SPEC, PROMPTS, PLAN, DEVLOG, PROMPT_CATALOG, METRICS, ARCHITECTURE, SUBMISSION
├─ .env.example
├─ package.json              # workspaces + `dev` = concurrently(gateway, web)
└─ vitest.config.ts
```

**Key invariant:** only the **browser** calls `/execute` (after WebAuthn). The web server has no such client/function — enforcing §2 rule 1 at the code level. I'll back this with a test that greps the web server tree for any execute client.

## 3. Build plan (SPEC §10) — deliverables, exit check, risks

| Phase | Dates | Prompts | Deliverables | Exit check |
|---|---|---|---|---|
| Days 1–2 | 29–30 Sep | 0, 1 | Plan; scaffold + seed | Plan agreed; both services run; `GET /accounts` shows seeded balances |
| Days 3–8 | 1–6 Oct | 2, 3, 4, 5, 6 | parse → chat/clarify → ASR → validator → gateway+WebAuthn+ledger+audit | Say a 3-part request, resolve 1 follow-up, sign with Face/Touch ID, balances change |
| Days 9–12 | 7–10 Oct | 7, 8 | risk/OTP/KYC/audit-chain; injection shield + red-team | All 6 scenarios pass; `tests/redteam/REPORT.md` |
| Days 13–16 | 11–16 Oct | 9, 10 | polish+a11y+metrics; deploy+submission docs | All submission items ticked + live link |

**Risks / questions**
- **WebAuthn needs HTTPS + a real RP ID.** Dev works on `localhost` (trusted origin), but the live demo must be HTTPS with RP ID = deployed domain. Confirm the domain early (Prompt 10).
- **"Agent never calls /execute" is the make-or-break property.** Enforced via code structure + a guard test (grep the web server tree for an execute client).
- **Tencent ASR creds** — if absent in dev, the Web Speech API fallback must behave identically downstream. Will real Tencent creds be available for the demo?
- **`depends_on` formula resolution** ("whatever's left", "half of it") must be deterministic TS computed in draft `sequence` order, never by the LLM.
- **Two SQLite DBs** (web vs gateway) + a read-only lookup endpoint — gateway owns accounts/ledger; web owns sessions + payee/biller mirror.
- **SPEC §11 does not exist yet.** My standing rules say to guard conflicts with §11, but the spec only has §1–§10. Flagging so we can add §11 (or confirm it's a future section) before it matters. No conflict for this prompt.

**Self-check vs "Done when":** the plan matches the spec and does **not** let the agent call the gateway's `/execute` — only the browser does, after WebAuthn. ✅