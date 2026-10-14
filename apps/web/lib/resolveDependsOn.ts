/**
 * Resolve depends_on formulas deterministically in TypeScript (SPEC §5).
 *
 * The LLM only flags the dependency + verbatim formula; it NEVER computes
 * the amount. We resolve "whatever is left", "half of it", etc. in code,
 * in draft sequence order, using actual account balances.
 */
import type { TransactionDraftT, AccountT } from "@dcta/shared";

export function resolveDependsOnAmount(
  formula: string,
  refDraft: TransactionDraftT,
  priorDrafts: TransactionDraftT[],
  accounts: AccountT[],
): number {
  const f = formula.toLowerCase().trim();
  const refAccount = accounts.find((a) => a.id === refDraft.source_account_id);
  const refBalance = refAccount?.balance ?? 0;

  // Sum of amounts already drawn from the same source account by prior drafts.
  const usedFromSource = priorDrafts
    .filter((d) => d.source_account_id === refDraft.source_account_id)
    .reduce((sum, d) => sum + d.amount.value, 0);

  const remaining = refBalance - usedFromSource;

  // "whatever is left" / "whatever's left" → remaining balance
  if (f.includes("whatever") && f.includes("left")) return round2(remaining);

  // "half of what's left" / "half of the rest" → half of remaining
  if (f.includes("half") && (f.includes("left") || f.includes("rest"))) return round2(remaining / 2);

  // "half of it" → half of the referenced draft's amount
  if (f.includes("half")) return round2(refDraft.amount.value / 2);

  // "quarter of it"
  if (f.includes("quarter")) return round2(refDraft.amount.value / 4);

  // "double it" / "twice that"
  if (f.includes("double") || f.includes("twice")) return round2(refDraft.amount.value * 2);

  // "the rest" / "what's left" → remaining
  if (f.includes("rest") || f.includes("left")) return round2(remaining);

  // Unknown formula — safe default: same as referenced amount
  return round2(refDraft.amount.value);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
