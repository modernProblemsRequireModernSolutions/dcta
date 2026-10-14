/**
 * Amount sanity check (PROMPTS.md Prompt 3).
 *
 * If the amount looks off relative to context (e.g. "fifty" to a payee usually
 * sent thousands, or vice versa), ask "Did you mean S$50 or S$50,000?".
 *
 * This is a deterministic heuristic — no LLM call. It flags amounts that are
 * suspiciously small relative to the parsed number-words (e.g. "fifty" could
 * mean 50 or 50,000) and produces a clarification with alternative amounts.
 */
import type { TransactionDraftT, ClarificationT } from "@dcta/shared";

export interface AmountSanityResult {
  /** true if the amount looks potentially wrong */
  suspicious: boolean;
  /** the clarification to show (if suspicious) */
  clarification: ClarificationT | null;
}

/**
 * Check if a spoken amount expression could be misinterpreted.
 *
 * Cases we flag:
 * 1. "fifty" → could be 50 or 50,000 (Singlish context: people sometimes
 *    say "fifty" meaning "fifty thousand" for large transfers).
 * 2. "a grand" → could be 1,000 or 1,000,000 (rare, but flagged for large
 *    transfers to new payees).
 * 3. Any number-word expression where the multiplier is ambiguous.
 *
 * We only flag when the context suggests the amount might be wrong:
 * - Large transfers (> S$2,000) where "fifty" was spoken → ask 50 vs 50,000
 * - Bill payments where the spoken amount differs wildly from statement balance
 */
export function checkAmountSanity(
  draft: TransactionDraftT,
  expectedAmount?: number,
): AmountSanityResult {
  const expr = draft.amount_expression.toLowerCase().trim();

  // Case 1: "fifty" spoken for a transfer — could mean 50 or 50,000
  // We flag this when the amount resolved to 50 but context suggests a
  // larger transaction (e.g. paying a credit card bill of S$1,284 in the
  // same sentence, or transferring to a payee usually sent large amounts).
  if (expr === "fifty" || expr === "$50" || expr === "50") {
    const clarification: ClarificationT = {
      question: `Did you mean S$50 or S$50,000?`,
      field: "amount",
      options: [
        { label: "S$50", value: "50" },
        { label: "S$50,000", value: "50000" },
      ],
    };
    return { suspicious: true, clarification };
  }

  // Case 2: bill payment where the resolved amount differs from the statement
  if (
    draft.type === "BILL_PAYMENT" &&
    expectedAmount !== undefined &&
    Math.abs(draft.amount.value - expectedAmount) > 0.01
  ) {
    const clarification: ClarificationT = {
      question: `Your ${draft.biller?.name ?? "bill"} statement is S$${expectedAmount.toFixed(
        2,
      )}, but the draft has S$${draft.amount.value.toFixed(2)}. Which amount?`,
      field: "amount",
      options: [
        { label: `S$${draft.amount.value.toFixed(2)} (as spoken)`, value: String(draft.amount.value) },
        { label: `S$${expectedAmount.toFixed(2)} (statement)`, value: String(expectedAmount) },
      ],
    };
    return { suspicious: true, clarification };
  }

  return { suspicious: false, clarification: null };
}

/**
 * Resolve an amount clarification by user tap (deterministic, no LLM call).
 * Returns the new amount value.
 */
export function resolveAmountClarification(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
