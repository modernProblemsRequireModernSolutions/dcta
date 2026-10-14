/**
 * Intent Parser tests (PROMPTS.md Prompt 2).
 *
 * Uses a fake LLM with scripted responses + injected seed data, so tests
 * are deterministic and don't need an API key or the gateway running.
 *
 * Done when: the tests pass and test 2 returns NEEDS_CLARIFICATION with
 * both Johns as options.
 */
import { describe, it, expect } from "vitest";
import { parseIntents, type LLMFn, type LookupData } from "../../apps/web/lib/intentParser";
import { seedAccounts, seedPayees, seedBillers, seedEquities } from "../fixtures/seedData";

const data: LookupData = {
  accounts: seedAccounts,
  payees: seedPayees,
  billers: seedBillers,
  equities: seedEquities,
};

// ── Fake LLM: returns scripted responses per input ───────────────────────────
function makeFakeLLM(): LLMFn {
  return async (_systemPrompt: string, userText: string) => {
    // Strip <user_input> tags
    const text = userText.replace(/<\/?user_input>/g, "").trim();

    if (text.includes("five hundred dollars from my savings to my mum")) {
      return {
        drafts: [
          {
            type: "TRANSFER",
            amount_expression: "five hundred dollars",
            source_account_hint: "savings",
            transfer_to: "mum",
            biller_name: null,
            equity_query: null,
            reference: "",
            source_span: "Transfer five hundred dollars from my savings to my mum",
            depends_on: null,
            confidence: 0.95,
          },
          {
            type: "EQUITY_BUY",
            amount_expression: "",
            source_account_hint: "savings",
            transfer_to: null,
            biller_name: null,
            equity_query: "Apple",
            reference: "",
            source_span: "invest whatever is left in Apple shares",
            depends_on: { draft_sequence: 1, formula: "whatever is left" },
            confidence: 0.88,
          },
        ],
      };
    }

    if (text.includes("credit card bill and send fifty to John")) {
      return {
        drafts: [
          {
            type: "BILL_PAYMENT",
            amount_expression: "",
            source_account_hint: null,
            transfer_to: null,
            biller_name: "credit card",
            equity_query: null,
            reference: "",
            source_span: "Pay my credit card bill",
            depends_on: null,
            confidence: 0.92,
          },
          {
            type: "TRANSFER",
            amount_expression: "fifty",
            source_account_hint: null,
            transfer_to: "John",
            biller_name: null,
            equity_query: null,
            reference: "",
            source_span: "send fifty to John",
            depends_on: null,
            confidence: 0.9,
          },
        ],
      };
    }

    if (text.includes("grand to my joint account")) {
      return {
        drafts: [
          {
            type: "TRANSFER",
            amount_expression: "a grand",
            source_account_hint: null,
            transfer_to: "joint account",
            biller_name: null,
            equity_query: null,
            reference: "",
            source_span: "Move a grand to my joint account",
            depends_on: null,
            confidence: 0.9,
          },
          {
            type: "EQUITY_BUY",
            amount_expression: "",
            source_account_hint: "brokerage",
            transfer_to: null,
            biller_name: null,
            equity_query: "DBS",
            reference: "",
            source_span: "buy DBS shares with half of it",
            depends_on: { draft_sequence: 1, formula: "half of it" },
            confidence: 0.85,
          },
        ],
      };
    }

    if (text.includes("Ah Boy for makan")) {
      return {
        drafts: [
          {
            type: "TRANSFER",
            amount_expression: "fifty",
            source_account_hint: null,
            transfer_to: "Ah Boy",
            biller_name: null,
            equity_query: null,
            reference: "makan lah",
            source_span: "Send fifty to Ah Boy for makan lah",
            depends_on: null,
            confidence: 0.93,
          },
        ],
      };
    }

    return { drafts: [] };
  };
}

describe("Intent Parser (Prompt 2)", () => {
  const llm = makeFakeLLM();

  // Test 1: multi-intent + depends_on resolved in TS
  it("1. splits multi-intent input and resolves 'whatever is left' deterministically", async () => {
    const result = await parseIntents("ses_test1", "Transfer five hundred dollars from my savings to my mum, and invest whatever is left in Apple shares", { llm, data });
    expect(result.error).toBeUndefined();
    expect(result.drafts).toHaveLength(2);

    const d1 = result.drafts[0];
    expect(d1.type).toBe("TRANSFER");
    expect(d1.amount.value).toBe(500);
    expect(d1.amount_expression).toBe("five hundred dollars");
    expect(d1.source_account_id).toBe("acc_sav_001");
    expect(d1.beneficiary?.payee_id).toBe("pay_mum");
    expect(d1.status).toBe("DRAFT");

    const d2 = result.drafts[1];
    expect(d2.type).toBe("EQUITY_BUY");
    expect(d2.depends_on).toEqual({ draft_sequence: 1, formula: "whatever is left" });
    // "whatever is left" = savings balance 12400 - draft1 amount 500 = 11900
    expect(d2.amount.value).toBe(11900);
    expect(d2.equity?.ticker).toBe("AAPL");
  });

  // Test 2: ambiguous John → NEEDS_CLARIFICATION with both Johns
  it("2. flags John as ambiguous → NEEDS_CLARIFICATION with both Johns as options", async () => {
    const result = await parseIntents("ses_test2", "Pay my credit card bill and send fifty to John", { llm, data });
    expect(result.error).toBeUndefined();
    expect(result.drafts).toHaveLength(2);

    // Draft 1: bill payment resolves cleanly
    const d1 = result.drafts[0];
    expect(d1.type).toBe("BILL_PAYMENT");
    expect(d1.biller?.biller_id).toBe("bil_dbs_cc");
    expect(d1.amount.value).toBe(1284.5);

    // Draft 2: John is ambiguous
    const d2 = result.drafts[1];
    expect(d2.type).toBe("TRANSFER");
    expect(d2.amount.value).toBe(50);
    expect(d2.status).toBe("NEEDS_CLARIFICATION");
    expect(d2.beneficiary).toBeNull();
    expect(d2.clarifications).toHaveLength(1);
    const clar = d2.clarifications[0];
    expect(clar.field).toBe("beneficiary");

    // Both Johns must be options
    const optionValues = clar.options.map((o) => o.value);
    expect(optionValues).toContain("pay_john_doe");
    expect(optionValues).toContain("pay_john_smith");
    expect(clar.options).toHaveLength(2);
  });

  // Test 3: "a grand" = 1000 + "half of it" = 500
  it("3. parses 'a grand' as 1000 and resolves 'half of it' as 500", async () => {
    const result = await parseIntents("ses_test3", "Move a grand to my joint account and then buy DBS shares with half of it", { llm, data });
    expect(result.error).toBeUndefined();
    expect(result.drafts).toHaveLength(2);

    const d1 = result.drafts[0];
    expect(d1.type).toBe("TRANSFER");
    expect(d1.amount.value).toBe(1000);
    expect(d1.amount_expression).toBe("a grand");
    // Destination = own joint account
    expect(d1.beneficiary?.payee_id).toBe("acc_jnt_001");

    const d2 = result.drafts[1];
    expect(d2.type).toBe("EQUITY_BUY");
    expect(d2.depends_on).toEqual({ draft_sequence: 1, formula: "half of it" });
    // "half of it" = 1000 / 2 = 500
    expect(d2.amount.value).toBe(500);
    expect(d2.equity?.ticker).toBe("D05");
  });

  // Test 4: Ah Boy resolves, "makan lah" is reference
  it("4. resolves Ah Boy uniquely and keeps 'makan lah' as reference", async () => {
    const result = await parseIntents("ses_test4", "Send fifty to Ah Boy for makan lah", { llm, data });
    expect(result.error).toBeUndefined();
    expect(result.drafts).toHaveLength(1);

    const d1 = result.drafts[0];
    expect(d1.type).toBe("TRANSFER");
    expect(d1.amount.value).toBe(50);
    expect(d1.beneficiary?.payee_id).toBe("pay_ah_boy");
    expect(d1.beneficiary?.display_name).toContain("Ah Boy");
    expect(d1.reference).toBe("makan lah");
    expect(d1.status).toBe("DRAFT");
  });
});
