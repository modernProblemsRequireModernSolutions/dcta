"use client";

import type { TransactionDraftT } from "@dcta/shared";

const TYPE_META: Record<TransactionDraftT["type"], { icon: string; label: string }> = {
  TRANSFER: { icon: "↗", label: "Transfer" },
  BILL_PAYMENT: { icon: "▤", label: "Bill payment" },
  EQUITY_BUY: { icon: "↗", label: "Equity purchase" },
};

const STATUS_STYLE: Record<TransactionDraftT["status"], string> = {
  DRAFT: "bg-blue-50 text-blue-700",
  NEEDS_CLARIFICATION: "bg-amber-100 text-amber-900",
  VALIDATED: "bg-emerald-50 text-emerald-700",
  FROZEN: "bg-amber-100 text-amber-900",
  AWAITING_SIGNATURE: "bg-purple-50 text-purple-700",
  EXECUTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

interface Props {
  draft: TransactionDraftT;
  disabled: boolean;
  onClarify: (draftId: string, field: string, value: string) => Promise<void>;
}

export default function DraftCard({ draft, disabled, onClarify }: Props) {
  const meta = TYPE_META[draft.type];
  const destination =
    draft.beneficiary
      ? `${draft.beneficiary.display_name} ${draft.beneficiary.masked_account}`
      : draft.biller
        ? `${draft.biller.name} · ${draft.biller.bill_account_ref}`
        : draft.equity
          ? `${draft.equity.ticker} · ${draft.equity.exchange}`
          : "Needs your choice";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-dbs-light text-lg font-bold text-dbs">
            {meta.icon}
          </span>
          <div>
            <p className="font-bold text-slate-900">{meta.label}</p>
            <p className="text-xs text-slate-500">Draft #{draft.sequence}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[draft.status]}`}>
          {draft.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
          <p className="text-2xl font-extrabold tabular-nums text-slate-950">
            {draft.amount.currency === "SGD" ? "S$" : `${draft.amount.currency} `}
            {draft.amount.value.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500">From your words: “{draft.amount_expression}”</p>
        </div>
        <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">To</dt>
          <dd className="font-semibold text-slate-900">{destination}</dd>
          <dt className="text-slate-500">From</dt>
          <dd className="font-medium text-slate-800">{draft.source_account_id}</dd>
          {draft.reference ? (
            <>
              <dt className="text-slate-500">Reference</dt>
              <dd>{draft.reference}</dd>
            </>
          ) : null}
        </dl>
      </div>

      {draft.clarifications.map((clarification) => (
        <div key={clarification.field} className="border-t border-amber-200 bg-amber-50 px-4 py-4">
          <p className="mb-3 text-sm font-bold text-amber-950">{clarification.question}</p>
          <div className="grid gap-2">
            {clarification.options.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => void onClarify(draft.draft_id, clarification.field, option.value)}
                className="min-h-12 rounded-xl border border-amber-300 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 shadow-sm hover:border-dbs hover:text-dbs disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </article>
  );
}
