/**
 * Deterministic fuzzy lookup against seeded data (SPEC §6).
 *
 * Called AFTER the LLM extracts names — the LLM never invents IDs.
 * Resolves payees, billers, accounts, and equities by fuzzy name matching.
 * Detects ambiguity (e.g. "John" → John Doe + John Smith) and returns
 * clarification options instead of guessing (SPEC §2 rule 6).
 */
import type {
  AccountT,
  PayeeT,
  BillerRecordT,
  EquityRecordT,
} from "@dcta/shared";

// ── Normalisation ────────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[•·]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q || !t) return 0;
  if (q === t) return 100;
  if (t.startsWith(q) || q.startsWith(t)) return 90;
  if (t.includes(q) || q.includes(t)) return 85;

  const qTokens = q.split(" ").filter(Boolean);
  const tTokens = t.split(" ").filter(Boolean);

  const tokMatch = (qt: string, tt: string) =>
    qt === tt || tt.startsWith(qt) || qt.startsWith(tt);

  // All query tokens found in target
  if (qTokens.every((qt) => tTokens.some((tt) => tokMatch(qt, tt)))) return 75;
  // All target tokens found in query (target is a subset, e.g. "Joint" ⊂ "joint account")
  if (tTokens.every((tt) => qTokens.some((qt) => tokMatch(qt, tt)))) return 70;

  const partial = qTokens.filter((qt) => tTokens.some((tt) => tokMatch(qt, tt)));
  if (partial.length > 0) return 40 + partial.length * 10;
  return 0;
}

const MATCH_THRESHOLD = 50;

// ── Accounts ─────────────────────────────────────────────────────────────────
export function resolveAccount(
  hint: string | null,
  accounts: AccountT[],
): { account: AccountT | null; ambiguous: boolean; options: AccountT[] } {
  if (!hint) {
    // Default to the primary savings account when unspecified (MVP convention).
    const savings = accounts.find((a) => a.type === "SAVINGS");
    return { account: savings ?? accounts[0] ?? null, ambiguous: false, options: [] };
  }
  const scored = accounts
    .map((a) => ({ a, score: Math.max(fuzzyScore(hint, a.name), fuzzyScore(hint, a.type)) }))
    .filter((x) => x.score >= MATCH_THRESHOLD)
    .sort((x, y) => y.score - x.score);

  if (scored.length === 0) return { account: null, ambiguous: false, options: [] };
  if (scored.length === 1) return { account: scored[0].a, ambiguous: false, options: [] };
  // Multiple accounts matched — ambiguous
  return { account: null, ambiguous: true, options: scored.map((x) => x.a) };
}

// ── Payees + own-account destinations (TRANSFER) ─────────────────────────────
export interface DestinationResult {
  beneficiary: { payee_id: string; display_name: string; masked_account: string } | null;
  ambiguous: boolean;
  options: { label: string; value: string }[];
}

export function resolveTransferDestination(
  name: string | null,
  accounts: AccountT[],
  payees: PayeeT[],
): DestinationResult {
  if (!name) {
    return {
      beneficiary: null,
      ambiguous: true,
      options: [],
    };
  }

  // 1. Check own accounts first (transfer between user's accounts)
  const accScored = accounts
    .map((a) => ({ a, score: fuzzyScore(name, a.name) }))
    .filter((x) => x.score >= MATCH_THRESHOLD)
    .sort((x, y) => y.score - x.score);

  if (accScored.length === 1) {
    const a = accScored[0].a;
    return {
      beneficiary: { payee_id: a.id, display_name: a.name, masked_account: a.name },
      ambiguous: false,
      options: [],
    };
  }

  // 2. Check payees (external transfer)
  const payeeScored = payees
    .map((p) => ({ p, score: fuzzyScore(name, p.display_name) }))
    .filter((x) => x.score >= MATCH_THRESHOLD)
    .sort((x, y) => y.score - x.score);

  if (payeeScored.length === 1) {
    const p = payeeScored[0].p;
    return {
      beneficiary: { payee_id: p.id, display_name: p.display_name, masked_account: p.masked_account },
      ambiguous: false,
      options: [],
    };
  }

  if (payeeScored.length > 1) {
    return {
      beneficiary: null,
      ambiguous: true,
      options: payeeScored.map((x) => ({
        label: `${x.p.display_name} ${x.p.masked_account}`,
        value: x.p.id,
      })),
    };
  }

  // No match at all
  return {
    beneficiary: null,
    ambiguous: true,
    options: [],
  };
}

// ── Billers ──────────────────────────────────────────────────────────────────
export function resolveBiller(
  name: string | null,
  billers: BillerRecordT[],
): BillerRecordT | null {
  if (!name) return null;
  const scored = billers
    .map((b) => ({ b, score: fuzzyScore(name, b.name) }))
    .filter((x) => x.score >= MATCH_THRESHOLD)
    .sort((x, y) => y.score - x.score);
  return scored[0]?.b ?? null;
}

// ── Equities (ticker + company-name aliases) ─────────────────────────────────
const EQUITY_ALIASES: Record<string, string> = {
  apple: "AAPL",
  "apple inc": "AAPL",
  "apple shares": "AAPL",
  dbs: "D05",
  "dbs group": "D05",
  "dbs shares": "D05",
  ocbc: "O39",
  "ocbc bank": "O39",
  "ocbc shares": "O39",
};

export function resolveEquity(
  query: string | null,
  equities: EquityRecordT[],
): { equity: EquityRecordT | null; ambiguous: boolean } {
  if (!query) return { equity: null, ambiguous: false };
  const norm = normalize(query);

  // Alias lookup first (company name → ticker)
  const aliasedTicker = EQUITY_ALIASES[norm] ?? EQUITY_ALIASES[norm.replace(/\bshares?\b/, "").trim()];
  if (aliasedTicker) {
    const eq = equities.find((e) => e.ticker === aliasedTicker);
    if (eq) return { equity: eq, ambiguous: false };
  }

  // Direct ticker match
  const byTicker = equities.find((e) => e.ticker.toLowerCase() === norm);
  if (byTicker) return { equity: byTicker, ambiguous: false };

  // Fuzzy on ticker
  const scored = equities
    .map((e) => ({ e, score: fuzzyScore(query, e.ticker) }))
    .filter((x) => x.score >= MATCH_THRESHOLD)
    .sort((x, y) => y.score - x.score);

  if (scored.length === 1) return { equity: scored[0].e, ambiguous: false };
  return { equity: scored[0]?.e ?? null, ambiguous: scored.length > 1 };
}
