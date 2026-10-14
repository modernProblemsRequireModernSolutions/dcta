# DCTA — Prompt Catalog

Tracking state for each prompt in `docs/PROMPTS.md`. Update after every prompt.

| # | Prompt | Phase / Days | Status | "Done when" | Notes |
|---|---|---|---|---|---|
| 0 | Plan only (no code) | Days 1–2 (29–30 Sep) | ✅ Done | plan matches spec; agent never calls `/execute` | see `docs/PLAN.md` |
| 1 | Scaffold + seed data | Days 1–2 | ✅ Done | both services start; `GET /accounts` returns seeded balances | monorepo + seed; web has NO /execute route |
| 2 | Intent parser (text) | Day 3 | ✅ Done | tests pass; test 2 → `NEEDS_CLARIFICATION` w/ both Johns | POST /api/parse; fake-LLM tests; 5/5 pass |
| 3 | Chat UI + clarify | Day 4 | 🔄 In progress | type test 2, resolve John with one tap | Next.js chat UI and deterministic clarification implemented; full API/build verification pending |
| 4 | Voice (ASR) | Day 5 | 🔄 Partial demo | say test 1 aloud → correct drafts | GitHub Pages UI includes browser Web Speech; Tencent `/api/asr` adapter pending |
| 5 | Validator agent | Day 6 | ⬜ | corruption test passes; frozen card in UI | |
| 6 | Gateway + WebAuthn | Days 7–8 | ⬜ | real biometric prompt; balance changes only after approve | fiddliest; don't cut security |
| 7 | Risk/OTP/KYC/audit | Day 9 | ⬜ | S$6k → step-up; tamper → Verify chain fails | |
| 8 | Injection shield + red-team | Days 10–11 | ⬜ | all 8 red-team pass; `REPORT.md` | feeds submission |
| 9 | Polish / a11y / metrics | Day 13 | ⬜ | `METRICS.md` written | |
| 10 | Deploy + submission | Days 14–16 | 🔄 In progress | live HTTPS URL + `SUBMISSION.md` | GitHub Pages static UI, submission copy, project context and cover image prepared; publication pending |

Legend: ✅ Done · 🔄 In progress · ⬜ Pending