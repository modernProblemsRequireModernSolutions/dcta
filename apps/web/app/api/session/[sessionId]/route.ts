/**
 * GET /api/session/[sessionId] → { messages, drafts }
 *
 * Returns the full chat thread + drafts for a session (server-side state,
 * SPEC §10 / Prompt 3).
 */
import { NextResponse } from "next/server";
import { getMessages, getDrafts } from "@/lib/sessionStore";

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } },
) {
  const messages = getMessages(params.sessionId);
  const drafts = getDrafts(params.sessionId);
  return NextResponse.json({ session_id: params.sessionId, messages, drafts });
}
