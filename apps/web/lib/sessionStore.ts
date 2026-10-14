/**
 * In-memory session store (SPEC §10 / Prompt 3: server-side state keyed by session_id).
 *
 * Keeps drafts + chat history per session so the chat UI and confirmation
 * screen can access them. Persistence to the web DB comes later; this is
 * sufficient for Prompts 2–3.
 */
import type { TransactionDraftT } from "@dcta/shared";

interface SessionState {
  drafts: TransactionDraftT[];
  messages: ChatMessage[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  draft_ids?: string[];
  created_at: number;
}

const sessions = new Map<string, SessionState>();

function ensureSession(sessionId: string): SessionState {
  let s = sessions.get(sessionId);
  if (!s) {
    s = { drafts: [], messages: [], createdAt: Date.now() };
    sessions.set(sessionId, s);
  }
  return s;
}

// ── Drafts ──────────────────────────────────────────────────────────────────
export function storeDrafts(sessionId: string, drafts: TransactionDraftT[]): void {
  const s = ensureSession(sessionId);
  // Replace existing drafts of the same sequence with newer versions; append new.
  for (const d of drafts) {
    const idx = s.drafts.findIndex(
      (existing) => existing.draft_id === d.draft_id,
    );
    if (idx >= 0) {
      s.drafts[idx] = d;
    } else {
      s.drafts.push(d);
    }
  }
}

export function getDrafts(sessionId: string): TransactionDraftT[] {
  return ensureSession(sessionId).drafts;
}

export function getDraft(
  sessionId: string,
  draftId: string,
): TransactionDraftT | undefined {
  return ensureSession(sessionId).drafts.find((d) => d.draft_id === draftId);
}

/**
 * Resolve a clarification by user tap (deterministic, no LLM call — SPEC §2 rule 6).
 * Mutates the stored draft in place and returns the updated copy.
 */
export function resolveClarification(
  sessionId: string,
  draftId: string,
  field: string,
  value: string,
): TransactionDraftT | undefined {
  const s = ensureSession(sessionId);
  const draft = s.drafts.find((d) => d.draft_id === draftId);
  if (!draft) return undefined;

  // Resolve beneficiary by payee_id (TRANSFER clarification)
  if (field === "beneficiary") {
    // The value could be a payee_id or an account_id (own-account transfer)
    // We need to look it up — but sessionStore doesn't have lookup data.
    // The /api/clarify route handles this: it receives the full resolved
    // beneficiary object and passes it here. So we just set it directly.
  }

  return draft;
}

/**
 * Apply a mutation to a stored draft (used by /api/clarify after it resolves
 * the option deterministically). Returns the updated draft or undefined.
 */
export function updateDraft(
  sessionId: string,
  draftId: string,
  mutator: (draft: TransactionDraftT) => TransactionDraftT,
): TransactionDraftT | undefined {
  const s = ensureSession(sessionId);
  const idx = s.drafts.findIndex((d) => d.draft_id === draftId);
  if (idx < 0) return undefined;
  const updated = mutator(s.drafts[idx]);
  s.drafts[idx] = updated;
  return updated;
}

// ── Chat messages ───────────────────────────────────────────────────────────
export function addMessage(
  sessionId: string,
  role: "user" | "agent",
  text: string,
  draftIds?: string[],
): ChatMessage {
  const s = ensureSession(sessionId);
  const msg: ChatMessage = {
    id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    role,
    text,
    draft_ids: draftIds,
    created_at: Date.now(),
  };
  s.messages.push(msg);
  return msg;
}

export function getMessages(sessionId: string): ChatMessage[] {
  return ensureSession(sessionId).messages;
}

// ── Session lifecycle ───────────────────────────────────────────────────────
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function createSession(): string {
  return `ses_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
