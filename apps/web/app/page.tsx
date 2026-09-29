// Placeholder home screen. The chat UI arrives in Prompt 3; intent parser in Prompt 2.
// For now this confirms the web app boots and can reach the gateway.
async function getAccounts() {
  const base = process.env.GATEWAY_URL ?? "http://localhost:4001";
  try {
    const res = await fetch(`${base}/accounts`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Array<{
      id: string;
      name: string;
      type: string;
      currency: string;
      balance: number;
    }>;
  } catch {
    return [];
  }
}

export default async function Page() {
  const accounts = await getAccounts();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4">
      <header className="border-b border-dbs-light pb-3">
        <h1 className="text-xl font-bold text-dbs">DCTA</h1>
        <p className="text-sm text-ink/70">
          Direct Conversational Transaction Agent — AI drafts, you sign.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/60">
          Accounts
        </h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-ink/60">
            Gateway not reachable. Start it with <code>npm run dev</code>.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-black/5 p-3 shadow-sm"
              >
                <span className="font-medium">{a.name}</span>
                <span className="tabular-nums">
                  {a.currency} {a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
