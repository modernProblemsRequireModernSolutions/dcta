# DCTA — Hackathon Submission Copy

> Copy the sections below into the Tencent Cloud Hackathon Singapore 2026 form. Replace placeholders in square brackets after the public URL and video are available.

## Project Title

**DCTA — Direct Conversational Transaction Agent**

## Short Blurb (under 10 words)

**Speak your banking; AI drafts, only you sign.**

Eight words, excluding punctuation.

## Project Description

### Project Overview — Target Scenarios, Users, and Value Proposition

DCTA is a mobile-first conversational banking prototype for DBS customers who need to complete several everyday tasks quickly: paying bills, transferring money to saved beneficiaries, moving funds between accounts, and drafting equity purchases. A customer can speak or type a natural request such as “Pay my credit-card bill, send fifty to John, and invest whatever is left in DBS shares.” DCTA splits the request into ordered, structured transaction drafts, resolves saved entities, asks short follow-up questions when a name or amount is ambiguous, and presents every item for explicit review.

The value proposition is simple: **AI handles navigation and drafting; the customer retains execution authority.** The system never allows the language model to move money. Only a separate execution gateway can post to the mock ledger after a fixed confirmation screen and device-bound WebAuthn approval.

### Real-World Scenario Insights

Banking customers frequently switch between separate menu flows for bill payment, beneficiary transfer and investing. Each flow requires account selection, beneficiary search, amount entry, reference entry, review and confirmation. This creates friction for mobile users, users with limited dexterity or vision, and customers who know what they want to do but not where each function lives.

The core problem is not a lack of banking features; it is the **interaction cost and risk of translating natural intent into multiple correct forms**. Conversational systems can reduce this burden, but financial AI introduces new risks: misheard amounts, ambiguous beneficiaries, prompt injection, overconfident guessing and unauthorized execution. DCTA addresses both sides: it reduces navigation effort while structurally separating AI drafting from trusted execution.

### Comprehensive Solution Design

DCTA uses a zero-trust, two-service architecture:

1. **Agent service — untrusted zone.** A Next.js application accepts typed or spoken requests, transcribes speech, extracts ordered intents, validates JSON with Zod, resolves saved accounts/payees/billers deterministically, computes dependency formulas in TypeScript, and asks tappable clarification questions. An independent validator compares each draft against the transcript; mismatches become `FROZEN`.
2. **Execution gateway — trusted zone.** A separate Express service owns mock accounts, ledger state, saved beneficiaries, passkey public keys, nonce state, risk controls and the final execution route. The agent has no execution credentials or server-side code path to `/execute`.
3. **Human authorization.** The gateway binds a single-use 120-second nonce to `SHA-256(canonical_json(draft) + nonce)`. A fixed UI displays the exact beneficiary, masked account, source account, amount and resulting balance. The browser obtains a WebAuthn assertion and sends the unchanged draft directly to the gateway.
4. **Defence in depth.** The gateway independently re-runs KYC, transfer limits, velocity and step-up rules. Suspicious instruction patterns are blocked. A hash-chained audit log records inputs, draft versions, clarifications, validation, signatures and gateway decisions.

Prompts drive generation through explicit contracts rather than unrestricted autonomy. The parser prompt outputs JSON only, treats delimited transcript content as untrusted data, preserves exact source spans and amount expressions, and never invents IDs. Deterministic lookup, schema validation, independent validation and gateway policy constrain every generated draft.

### Business Value and Quantitative Benefits

For a representative three-task journey—credit-card payment, beneficiary transfer and equity purchase—a conventional mobile-banking flow can require roughly **35–45 taps** across three separate navigation paths. DCTA targets the same intent in **one spoken or typed request, one clarification tap when needed, three reviews and three biometric approvals**. That is approximately **8–10 primary interactions**, a potential reduction of **70–80%** under the stated assumptions.

DCTA also centralizes safety controls that are difficult to guarantee in a free-form agent:

- 100% of execution attempts require a signed, exact draft in the target architecture.
- Ambiguous beneficiaries produce multiple-choice clarification instead of guessing.
- Validator mismatches freeze the affected draft.
- Nonces expire after 120 seconds and can be used once.
- The eight planned red-team scenarios must show zero unauthorized balance movement.
- Hash-chain verification makes edited or deleted audit events detectable.

These are MVP estimates and test targets, not production claims. Final measured demo timings and taps should be inserted from `docs/METRICS.md` before submission.

## Cover Image

Upload:

`docs/assets/dcta-cover-3840x2160.png`

Target: 3840×2160 PNG, 16:9, under 1 MB, with no DBS logo.

## Project Link

**Public UI demo:** `https://modernproblemsrequiremodernsolutions.github.io/dcta/`

**Source repository:** `https://github.com/modernProblemsRequireModernSolutions/dcta`

> The GitHub Pages link is a static, credential-free UI demonstration. It creates mock drafts and demonstrates clarification/voice/injection blocking; it does not execute real transactions. The full two-service implementation remains in the repository.

## Demo Video Link

Paste the public, no-login video URL here:

`[ADD YOUTUBE / GOOGLE DRIVE / TENCENT VIDEO LINK]`

Recommended 5–8 minute structure:

1. **0:00–0:30 — Problem and promise:** Three banking tasks normally require separate flows; “AI drafts, only you sign.”
2. **0:30–2:15 — Happy path:** Speak/type the three-part request, show split drafts, resolve John with one tap, and review deterministic fields.
3. **2:15–3:00 — Validator:** Deliberately corrupt S$50 to S$5,000; show `FROZEN` and disabled signing.
4. **3:00–4:00 — Trust boundary:** Explain canonical draft hashing, one-use nonce, browser WebAuthn and the separate gateway.
5. **4:00–4:45 — Attack defence:** Show instruction injection and unsigned `/execute` rejection; no money moves.
6. **4:45–5:30 — Risk and audit:** Show S$6,000 step-up, pending-KYC block and audit-chain tamper detection.
7. **5:30–6:30 — Architecture and tools:** Explain Next.js/Express/SQLite/Zod, CodeBuddy prompt-by-prompt development, and responsible-AI choices.
8. **6:30–7:00 — Value:** Show tap/time estimates, repository, public demo and next steps.

## WorkBuddy / CodeBuddy / Miora Conversation History

The form allows **3–7 images**, maximum **10 MB each**. Export screenshots that clearly show:

1. Prompt 0 — security plan and explicit prohibition on agent `/execute` calls.
2. Prompt 1 — monorepo scaffold, seeded accounts and “Done when” verification.
3. Prompt 2 — parser tests and ambiguous John result.
4. Prompt 3 — chat UI and deterministic one-tap clarification.
5. Prompt 5/6 — validator freeze and WebAuthn trust-boundary implementation.
6. Prompt 7/8 — risk/audit and red-team results.
7. Prompt 10 — deployment, architecture and submission preparation.

Prefer screenshots containing the project prompt, the implementation action, and the test/result in one frame. Redact any credentials.

## Social Media Post (Bonus)

Suggested copy:

> We built **DCTA — Direct Conversational Transaction Agent** for the Tencent Cloud AI CAN DO IT Hackathon Singapore 2026 Banking Track. Customers speak or type multi-step banking requests; AI creates structured drafts, deterministic checks resolve ambiguity, and a separate gateway requires exact user authorization before any mock transaction can execute. The core idea: **AI drafts, only you sign.**
>
> Demo: https://modernproblemsrequiremodernsolutions.github.io/dcta/
> Code: https://github.com/modernProblemsRequireModernSolutions/dcta
>
> #WorkBuddy #CodeBuddy #Miora #TencentCloudHackathon #TencentCloud

Post this on Xiaohongshu, YouTube, X or WeChat Channels and paste the public post URL into the form.

## Final Pre-Submission Checklist

- [ ] Public project URL opens without login.
- [ ] Source repository is visible to judges.
- [ ] Cover image is 16:9 and under 1 MB.
- [ ] Demo video is 5–8 minutes and public/unlisted without access approval.
- [ ] Upload 3–7 CodeBuddy/WorkBuddy/Miora conversation screenshots.
- [ ] Confirm the short blurb is under 10 words.
- [ ] Replace estimates with measured values from `docs/METRICS.md` where available.
- [ ] Verify no `.env`, token, API key, passkey private material or secret appears in Git.
- [ ] Submit before 16 October 2026, 23:59 Singapore time.
