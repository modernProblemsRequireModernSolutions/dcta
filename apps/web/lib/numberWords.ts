/**
 * Number-words → number parser.
 *
 * Converts spoken amount expressions like "five hundred", "fifty",
 * "a grand", "fifty thousand" into numbers. Used by the intent parser
 * to turn amount_expression (SPEC §5, the user's original words) into
 * amount.value — deterministically in code, never by the LLM.
 *
 * Currency words (dollars, SGD, $, cents) and slang (grand, k) are handled.
 */

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
};
const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

// Words to strip (currency, filler).
const IGNORE = new Set([
  "dollars", "dollar", "sgd", "s", "usd", "cents", "cent", "only",
  "bucks", "quid", "and", "the", "a", "an", "of", "to", "please",
]);

export function parseNumberWords(input: string): number {
  if (!input || !input.trim()) return 0;

  // Already a plain number? ("50", "5000.00", "$50")
  const direct = input.replace(/[$,]/g, "").trim();
  const parsed = Number(direct);
  if (!isNaN(parsed) && direct !== "") return parsed;

  const words = input
    .toLowerCase()
    .replace(/[€$£,]/g, " ")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let result = 0;
  let current = 0;

  for (const word of words) {
    // "2k", "5k" → multiply by 1000
    const kMatch = word.match(/^(\d+(?:\.\d+)?)k$/);
    if (kMatch) {
      current += parseFloat(kMatch[1]) * 1000;
      continue;
    }
    // Plain numeric token ("50", "500")
    if (/^\d+(?:\.\d+)?$/.test(word)) {
      current += parseFloat(word);
      continue;
    }
    if (word in ONES) { current += ONES[word]; continue; }
    if (word in TEENS) { current += TEENS[word]; continue; }
    if (word in TENS) { current += TENS[word]; continue; }
    if (word === "hundred") { current *= 100; continue; }
    if (word === "thousand") { result += (current || 1) * 1000; current = 0; continue; }
    if (word === "million") { result += (current || 1) * 1_000_000; current = 0; continue; }
    // Slang: "grand" = ×1000
    if (word === "grand") { result += (current || 1) * 1000; current = 0; continue; }
    if (word === "k") { result += (current || 1) * 1000; current = 0; continue; }
    // "a"/"an" before a scale word means 1 (e.g. "a grand") — but only if not already counted
    if ((word === "a" || word === "an") && current === 0) { current = 1; continue; }
    // Ignore currency words and filler
    if (IGNORE.has(word)) continue;
    // Unknown word — skip (could be a payee name mixed in)
  }

  result += current;
  return result;
}
