/**
 * DCTA shared schemas + types — the Transaction Draft (SPEC §5).
 *
 * The draft is the single structured artefact that flows from the (untrusted)
 * agent to the (trusted) gateway. It is produced by the LLM, schema-validated
 * with zod, checked by the validator, rendered by fixed UI, and finally signed.
 */
import { z } from "zod";

// ── Enums ───────────────────────────────────────────────────────────────────
export const TransactionType = z.enum(["TRANSFER", "BILL_PAYMENT", "EQUITY_BUY"]);
export type TransactionTypeT = z.infer<typeof TransactionType>;

export const DraftStatus = z.enum([
  "DRAFT",
  "NEEDS_CLARIFICATION",
  "VALIDATED",
  "FROZEN",
  "AWAITING_SIGNATURE",
  "EXECUTED",
  "REJECTED",
]);
export type DraftStatusT = z.infer<typeof DraftStatus>;

export const ValidationVerdict = z.enum(["MATCH", "MISMATCH"]);
export type ValidationVerdictT = z.infer<typeof ValidationVerdict>;

export const RiskTier = z.enum(["LOW", "STEP_UP", "BLOCK"]);
export type RiskTierT = z.infer<typeof RiskTier>;

// ── Value objects ───────────────────────────────────────────────────────────
export const Money = z.object({
  value: z.number().nonnegative(),
  currency: z.string().length(3).default("SGD"),
});
export type MoneyT = z.infer<typeof Money>;

export const Beneficiary = z
  .object({
    payee_id: z.string(),
    display_name: z.string(),
    masked_account: z.string(),
  })
  .nullable();
export type BeneficiaryT = z.infer<typeof Beneficiary>;

export const Biller = z
  .object({
    biller_id: z.string(),
    name: z.string(),
    bill_account_ref: z.string(),
  })
  .nullable();
export type BillerT = z.infer<typeof Biller>;

export const Equity = z
  .object({
    ticker: z.string(),
    exchange: z.string(),
    order_type: z.literal("MARKET"),
    quantity: z.number().positive().optional(),
    notional: z.number().positive().optional(),
  })
  .nullable();
export type EquityT = z.infer<typeof Equity>;

/**
 * depends_on handles "invest whatever is left" / "half of it": it points to
 * another draft (by sequence) and carries a formula resolved DETERMINISTICALLY
 * in code, never by the LLM.
 */
export const DependsOn = z
  .object({
    draft_sequence: z.number().int().positive(),
    formula: z.string(),
  })
  .nullable();
export type DependsOnT = z.infer<typeof DependsOn>;

// ── Validation / risk / clarifications ──────────────────────────────────────
export const ValidationIssue = z.object({
  field: z.string(),
  expected_from_transcript: z.string(),
  found_in_draft: z.string(),
});
export type ValidationIssueT = z.infer<typeof ValidationIssue>;

export const Validation = z.object({
  verdict: ValidationVerdict,
  issues: z.array(ValidationIssue).default([]),
});
export type ValidationT = z.infer<typeof Validation>;

export const Risk = z.object({
  tier: RiskTier,
  reasons: z.array(z.string()).default([]),
});
export type RiskT = z.infer<typeof Risk>;

export const ClarificationOption = z.object({
  label: z.string(),
  value: z.string(),
});

export const Clarification = z.object({
  question: z.string(),
  field: z.string(),
  options: z.array(ClarificationOption),
});
export type ClarificationT = z.infer<typeof Clarification>;

// ── The Transaction Draft (SPEC §5) ─────────────────────────────────────────
export const TransactionDraft = z.object({
  draft_id: z.string(),
  session_id: z.string(),
  sequence: z.number().int().positive(),
  type: TransactionType,
  source_account_id: z.string(),
  amount: Money,
  amount_expression: z.string(),
  depends_on: DependsOn.default(null),
  beneficiary: Beneficiary.default(null),
  biller: Biller.default(null),
  equity: Equity.default(null),
  reference: z.string().default(""),
  source_span: z.string(),
  confidence: z.number().min(0).max(1),
  status: DraftStatus,
  clarifications: z.array(Clarification).default([]),
  validation: Validation.default({ verdict: "MATCH", issues: [] }),
  risk: Risk.default({ tier: "LOW", reasons: [] }),
  created_at: z.string(),
});
export type TransactionDraftT = z.infer<typeof TransactionDraft>;

// ── Account / payee / biller / equity read models (mock core-banking data) ──
export const Account = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  type: z.enum(["SAVINGS", "CURRENT", "JOINT", "BROKERAGE"]),
  currency: z.string().length(3),
  balance: z.number(),
});
export type AccountT = z.infer<typeof Account>;

export const Payee = z.object({
  id: z.string(),
  user_id: z.string(),
  display_name: z.string(),
  masked_account: z.string(),
  reference: z.string().default(""),
  added_at: z.string(),
});
export type PayeeT = z.infer<typeof Payee>;

export const BillerRecord = z.object({
  id: z.string(),
  name: z.string(),
  bill_account_ref: z.string(),
  amount_due: z.number(),
  currency: z.string().length(3),
});
export type BillerRecordT = z.infer<typeof BillerRecord>;

export const EquityRecord = z.object({
  ticker: z.string(),
  exchange: z.string(),
  currency: z.string().length(3),
  price: z.number().positive(),
});
export type EquityRecordT = z.infer<typeof EquityRecord>;
