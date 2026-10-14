/**
 * Lookup-data fetcher: reads payees/billers/accounts/equities from the
 * gateway's read-only endpoints (SPEC §6, Prompt 1).
 */
import type { LookupData } from "./intentParser";

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:4001";

export async function getLookupData(): Promise<LookupData> {
  const fetchAll = async (path: string) => {
    const res = await fetch(`${GATEWAY_URL}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Gateway ${path} returned ${res.status}`);
    return res.json();
  };

  const [accounts, payees, billers, equities] = await Promise.all([
    fetchAll("/accounts"),
    fetchAll("/payees"),
    fetchAll("/billers"),
    fetchAll("/equities"),
  ]);

  return { accounts, payees, billers, equities };
}
