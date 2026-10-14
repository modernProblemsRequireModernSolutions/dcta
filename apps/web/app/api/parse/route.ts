/**
 * POST /api/parse { session_id, text } → { drafts[] }
 *
 * Intent Parser API route (PROMPTS.md Prompt 2).
 * Uses the real OpenAI-compatible LLM + gateway lookup data.
 */
import { NextResponse } from "next/server";
import { parseIntents, type LookupData } from "@/lib/intentParser";
import { callLLM } from "@/lib/llmClient";
import { getLookupData } from "@/lib/gatewayData";
import { storeDrafts, addMessage, createSession } from "@/lib/sessionStore";
import { logParse } from "@/lib/auditStub";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId: string = body.session_id || createSession();
    const text: string = body.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text' field" }, { status: 400 });
    }

    // Store the user message in the chat thread
    addMessage(sessionId, "user", text);

    const data: LookupData = await getLookupData();
    const result = await parseIntents(sessionId, text, { llm: callLLM, data });

    const draftIds: string[] = [];
    if (result.drafts.length > 0) {
      storeDrafts(sessionId, result.drafts);
      draftIds.push(...result.drafts.map((d) => d.draft_id));
      logParse(sessionId, text, result.drafts.length);
    }

    // Agent response in the chat thread
    const agentText =
      result.drafts.length > 0
        ? result.drafts.some((d) => d.status === "NEEDS_CLARIFICATION")
          ? "I've drafted your transactions. One needs a quick clarification — tap an option below."
          : `I've drafted ${result.drafts.length} transaction${result.drafts.length > 1 ? "s" : ""}. Review them below.`
        : "I couldn't parse that. Could you rephrase your request?";
    addMessage(sessionId, "agent", agentText, draftIds);

    if (result.error) {
      return NextResponse.json({ error: result.error, drafts: result.drafts }, { status: 422 });
    }

    return NextResponse.json({ session_id: sessionId, drafts: result.drafts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
