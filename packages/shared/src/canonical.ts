/**
 * Canonical JSON for tamper-evident hashing (SPEC §2 rule 2, §8).
 *
 * Used to compute the WebAuthn challenge:
 *   challenge = base64url(SHA-256(canonical_json(draft) + nonce))
 *
 * Rules: object keys sorted ascending, no insignificant whitespace, UTF-8.
 * Producing identical bytes for logically-equal JSON regardless of key order,
 * so the agent, the gateway and the audit log all hash to the same value.
 */

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize(obj[key]);
        return acc;
      }, {});
  }
  return value;
}
