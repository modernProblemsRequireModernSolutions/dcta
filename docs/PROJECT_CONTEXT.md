# DCTA — Consolidated Project Prompts and Working Context

This file is the **single handoff document** for continuing DCTA development. It consolidates the project instructions supplied by the project owner without duplicating the canonical implementation blocks in `docs/PROMPTS.md`.

## 1. Repository and source of truth

- Repository: `https://github.com/modernProblemsRequireModernSolutions/dcta`
- Product and security source of truth: [`docs/SPEC.md`](./SPEC.md)
- Canonical sequential implementation prompts: [`docs/PROMPTS.md`](./PROMPTS.md)
- Prompt completion tracker: [`docs/PROMPT_CATALOG.md`](./PROMPT_CATALOG.md)
- Development record: [`docs/DEVLOG.md`](./DEVLOG.md)
- Architecture/build plan: [`docs/PLAN.md`](./PLAN.md)

If another file conflicts with `docs/SPEC.md`, stop and follow the spec.

## 2. Project-owner operating instructions

The owner initially provided this working instruction:

> “This repo is DCTA, my DBS hackathon MVP. Read docs/SPEC.md (source of truth) and docs/PROMPTS.md. Rules: when I say ‘Run Prompt N’, do only that prompt's block, commit and push when done, tell me the exact commands to run it locally on Windows/Mac, and check it against the ‘Done when’ line. Keep docs/DEVLOG.md and docs/PROMPT_CATALOG.md updated. Secrets only in .env with a .env.example. If a request conflicts with SPEC §2 or §11, stop and tell me.”

Clarifications accumulated during the project:

1. Respond in English.
2. After every prompt:
   - run its test/exit check;
   - update `DEVLOG.md` and `PROMPT_CATALOG.md`;
   - create a commit;
   - push when GitHub authentication is available;
   - provide exact Windows and macOS commands.
3. Never commit credentials. Runtime secrets belong in `.env`; safe variable names/defaults belong in `.env.example`.
4. When direct pushing is unavailable, package a complete repository snapshot without `node_modules`.
5. For submission, consolidate context, publish the repository, provide a public UI demo, and prepare the hackathon-form content.
6. `docs/SPEC.md` currently ends at §10; there is no §11. The standing conflict rule therefore applies to §2 and to any future §11 if one is added.

## 3. Non-negotiable zero-trust summary

The full wording is in SPEC §2. The implementation must preserve these outcomes:

1. AI creates transaction drafts only; it cannot execute.
2. The execution gateway is separate and independently trusted.
3. A WebAuthn signature is bound to the exact canonical draft plus a single-use 120-second nonce.
4. Confirmation screens are fixed UI rendered from draft JSON, never generated HTML/text.
5. Validator mismatch freezes a draft.
6. Ambiguity causes a short clarification rather than a guess.
7. Transcript, payee, bill and reference text remains untrusted data.
8. The gateway re-runs KYC, limits and velocity rules.
9. Inputs, drafts, clarifications, validation, signing and gateway decisions are hash-chain audited.

## 4. Canonical prompt sequence

The authoritative prompt text and each “Done when” check remain in [`docs/PROMPTS.md`](./PROMPTS.md). Do not maintain a divergent copy. The sequence is:

| Prompt | Deliverable | Exit check |
|---:|---|---|
| 0 | Plan only | Plan matches spec; agent cannot call `/execute` |
| 1 | Monorepo scaffold and seed data | Both services start; gateway `/accounts` returns seeded balances |
| 2 | Text intent parser | Tests pass; ambiguous John returns both options |
| 3 | Chat UI and clarification | Test 2 can be typed and John resolved with one tap |
| 4 | Voice input | Test 1 can be spoken and produces correct drafts |
| 5 | Independent validator | Corrupted draft freezes and displays reason |
| 6 | WebAuthn gateway | Real biometric prompt; ledger changes only after approval |
| 7 | Risk, OTP, KYC, audit | S$6,000 steps up; tamper detection fails verification |
| 8 | Injection shield and red team | All eight attacks move no money |
| 9 | Accessibility and metrics | Metrics document and accessible demo flow complete |
| 10 | Deployment and submission | Public HTTPS URL and submission package complete |

## 5. Demonstration and hosting context

- The full Next.js + Express application requires server-side hosting and cannot run entirely on GitHub Pages.
- `docs/index.html` is a credential-free **static UI demonstration** for GitHub Pages. It demonstrates text/voice input, deterministic draft creation, ambiguity handling and injection blocking, but it deliberately performs no transaction execution.
- The production architecture remains the separate web + gateway services defined in the spec.
- WorkBuddy credentials must never be copied into the deployed application.

## 6. Hackathon submission fields

The supplied submission form requests:

1. Project Title
2. Short Blurb (under 10 words)
3. Project Description covering:
   - project overview, target scenarios/users/value proposition;
   - real-world scenario insights: source of pain points, target audience and core problem solved;
   - comprehensive solution design: business and technical architecture, and how prompts drive AI generation;
   - business value with clear quantitative metrics or benefits.
4. A 16:9 cover image, recommended 3840×2160, accepted JPG/PNG up to 1 MB.
5. Project Link — live URL or demo link.
6. Demo Video Link — 5–8 minutes covering overview, core agent features, focused walkthrough and development-tool approach.
7. WorkBuddy/CodeBuddy/Miora Conversation History — 3–7 exported images, maximum 10 MB each.
8. Optional social-media post link using the requested hackathon/tool hashtags.

Submission-ready copy is maintained in [`docs/SUBMISSION.md`](./SUBMISSION.md).

## 7. Continuation checklist

Before starting a new prompt:

- re-read `docs/SPEC.md` and only the requested prompt block;
- inspect the repository status and latest remote branch;
- do not mix unrelated prompts unless the project owner explicitly asks for consolidation;
- run the prompt-specific tests and the full regression suite;
- update tracking documents;
- commit with a prompt-numbered message;
- report exact local commands, changed files, commit hash, push status and “Done when” result.
