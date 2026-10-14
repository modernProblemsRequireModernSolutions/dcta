/**
 * POST /api/clarify { session_id, draft_id, field, value }
 *
 * Resolves a NEEDS_CLARIFICATION draft by a user tap (deterministic, no LLM
 * call — SPEC §2 rule 6). The browser sends the chosen option value; we look
 * it up against seeded data server-side, update the stored draft, and return
 * the updated draft.
 *
 * Supports:
 * - field "beneficiary": value = payee_id or account_id → resolves beneficiary
 * - field "amount": value = numeric string → updates amount
 * - field "biller": value = biller_id → resolves biller
 * - field "equity": value = ticker → resolves equity
 */
import { NextResponse } from "next/server";
import { getLookupData } from "@/lib/gatewayData";
import { updateDraft, getDraft } from "@/lib/sessionStore";
import { logAudit } from "@/lib/auditStub";
import { resolveAmountClarification } from "@/lib/amountSanity";
import type { TransactionDraftT } from "@dcta/shared";
import type { LookupData } from "@/lib/intentParser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId: string = body.session_id;
    const draftId: string = body.draft_id;
    const field: string = body.field;
    const value: string = body.value;

    if (!sessionId || !draftId || !field || !value) {
      return NextResponse.json(
        { error: "Missing session_id, draft_id, field, or value" },
        { status: 400 },
      );
    }

    const existing = getDraft(sessionId, draftId);
    if (!existing) {
      return NextResponse.json(
        { error: `Draft ${draftId} not found in session ${sessionId}` },
        { status: 404 },
      );
    }

    const data: LookupData = await getLookupData();

    const updated = updateDraft(sessionId, draftId, (draft: TransactionDraftT) => {
      return resolveClarificationField(draft, field, value, data);
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to resolve clarification" },
        { status: 500 },
      );
    }

    logAudit({
      session_id: sessionId,
      actor: "user",
      event_type: "CLARIFICATION_RESOLVED",
      payload: { draft_id: draftId, field, value, new_status: updated.status },
    });

    return NextResponse.json({ session_id: sessionId, draft: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Deterministic resolution of a single clarification field (no LLM call).
 * Removes the resolved clarification; if none remain, status → DRAFT.
 */
function resolveClarificationField(
  draft: TransactionDraftT,
  field: string,
  value: string,
  data: LookupData,
): TransactionDraftT {
  const remaining = draft.clarifications.filter((c) => c.field !== field);

  let patch: Partial<TransactionDraftT> = {};

  if (field === "beneficiary") {
    const payee = data.payees.find((p) => p.id === value);
    const account = data.accounts.find((a) => a.id === value);
    if (payee) {
      patch = {
        beneficiary: {
          payee_id: payee.id,
          display_name: payee.display_name,
          masked_account: payee.masked_account,
        },
      };
    } else if (account) {
      patch = {
        beneficiary: {
          payee_id: account.id,
          display_name: account.name,
          masked_account: account.name,
        },
      };
    }
  } else if (field === "amount") {
    const newAmount = resolveAmountClarification(value);
    patch = { amount: { value: newAmount, currency: draft.amount.currency } };
  } else if (field === "biller") {
    const biller = data.billers.find((b) => b.id === value);
    if (biller) {
      patch = {
        biller: {
          biller_id: biller.id,
          name: biller.name,
          bill_account_ref: biller.bill_account_ref,
        },
        amount: { value: biller.amount_due, currency: biller.currency },
      };
    }
  } else if (field === "equity") {
    const eq = data.equities.find((e) => e.ticker === value);
    if (eq) {
      patch = {
        equity: {
          ticker: eq.ticker,
          exchange: eq.exchange,
          order_type: "MARKET" as const,
          notional: draft.amount.value > 0 ? draft.amount.value : undefined,
        },
      };
    }
  }

  // No change if we couldn't resolve the value
  if (Object.keys(patch).length === 0) return draft;

  const status: TransactionDraftT["status"] =
    remaining.length > 0 ? "NEEDS_CLARIFICATION" : "DRAFT";

  return { ...draft, ...patch, clarifications: remaining, status };
}
