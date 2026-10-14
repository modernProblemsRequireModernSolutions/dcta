/**
 * Audit stub (SPEC §2 rule 9).
 *
 * Simple console-based logger for now. The real hash-chained audit log
 * (SPEC §8) is built in Prompt 7.
 */
export interface AuditEvent {
  session_id: string;
  actor: string;
  event_type: string;
  payload: unknown;
}

export function logAudit(event: AuditEvent): void {
  // Stub: just log to console. Prompt 7 replaces this with the hash-chained log.
  console.log(`[audit] ${new Date().toISOString()} ${event.event_type} session=${event.session_id}`);
}

export function logParse(sessionId: string, text: string, draftCount: number): void {
  logAudit({
    session_id: sessionId,
    actor: "agent",
    event_type: "INTENT_PARSED",
    payload: { text_length: text.length, draft_count: draftCount },
  });
}
