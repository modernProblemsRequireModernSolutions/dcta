"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { TransactionDraftT } from "@dcta/shared";
import DraftCard from "./DraftCard";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
};

const SAMPLE = "Pay my credit card bill and send fifty to John";

function makeSessionId() {
  return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatScreen() {
  const [sessionId] = useState(makeSessionId);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hi Wei Jun. Tell me what you want to pay, transfer or invest. I will only create drafts — nothing moves without your approval.",
    },
  ]);
  const [drafts, setDrafts] = useState<TransactionDraftT[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const threadEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, drafts]);

  async function submitText(value: string) {
    const clean = value.trim();
    if (!clean || busy) return;
    setText("");
    setError("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: `u_${Date.now()}`, role: "user", text: clean },
    ]);

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, text: clean }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create drafts");

      setDrafts((current) => [...current, ...data.drafts]);
      const needsChoice = data.drafts.some(
        (draft: TransactionDraftT) => draft.status === "NEEDS_CLARIFICATION",
      );
      setMessages((current) => [
        ...current,
        {
          id: `a_${Date.now()}`,
          role: "agent",
          text: needsChoice
            ? "I drafted your requests. One detail needs your choice."
            : `I created ${data.drafts.length} draft${data.drafts.length === 1 ? "" : "s"} for review.`,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setMessages((current) => [
        ...current,
        { id: `e_${Date.now()}`, role: "agent", text: "I could not create a safe draft. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function clarify(draftId: string, field: string, value: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, draft_id: draftId, field, value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not resolve that choice");
      setDrafts((current) =>
        current.map((draft) => (draft.draft_id === draftId ? data.draft : draft)),
      );
      const label = data.draft.beneficiary?.display_name ?? "your choice";
      setMessages((current) => [
        ...current,
        { id: `c_${Date.now()}`, role: "agent", text: `Resolved to ${label}. No LLM call was needed.` },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve clarification");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitText(text);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-slate-50 shadow-xl">
      <header className="sticky top-0 z-10 bg-white px-5 pb-4 pt-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-dbs">DCTA prototype</p>
            <h1 className="text-xl font-bold text-ink">AI drafts. You sign.</h1>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Draft-only
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          No real DBS logo, accounts or money movement. This hackathon MVP creates mock transaction drafts.
        </p>
      </header>

      <section
        aria-label="Conversation"
        aria-live="polite"
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              message.role === "user"
                ? "ml-auto rounded-br-sm bg-dbs text-white"
                : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
            }`}
          >
            {message.text}
          </div>
        ))}

        {drafts.map((draft) => (
          <DraftCard key={draft.draft_id} draft={draft} onClarify={clarify} disabled={busy} />
        ))}

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        <div ref={threadEnd} />
      </section>

      <div className="border-t border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={() => void submitText(SAMPLE)}
          disabled={busy}
          className="mb-3 w-full rounded-xl border border-dbs/30 bg-dbs-light px-4 py-2 text-left text-sm font-semibold text-dbs-dark disabled:opacity-50"
        >
          Try demo: “{SAMPLE}”
        </button>
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <label className="sr-only" htmlFor="chat-input">Banking request</label>
          <textarea
            id="chat-input"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit(event as unknown as FormEvent);
              }
            }}
            rows={1}
            placeholder="Type a payment, transfer or investment…"
            className="min-h-12 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-dbs focus:ring-2"
          />
          <button
            type="button"
            aria-label="Voice input will be added in Prompt 4"
            title="Voice input arrives in Prompt 4"
            className="grid h-12 w-12 place-items-center rounded-full border border-slate-300 bg-white text-lg"
          >
            ◉
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="h-12 rounded-2xl bg-dbs px-5 font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
