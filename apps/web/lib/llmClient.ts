/**
 * OpenAI-compatible LLM client (SPEC §4).
 *
 * Uses LLM_BASE_URL, LLM_API_KEY, LLM_MODEL from env so it can point at
 * Tencent Hunyuan or any compatible endpoint. Requests JSON-mode output.
 */
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./intentParser";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const baseURL = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error("LLM_BASE_URL and LLM_API_KEY must be set in .env");
  }
  client = new OpenAI({ baseURL, apiKey });
  return client;
}

export async function callLLM(_systemPrompt: string, userText: string): Promise<unknown> {
  const c = getClient();
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const response = await c.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });
  const content = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}
