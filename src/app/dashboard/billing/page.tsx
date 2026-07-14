import { getCurrentUser } from "@/server/auth";
import { getLedger } from "@/lib/billing/credits";
import { BuyCredits } from "@/components/BuyCredits";

const REASON_LABEL: Record<string, string> = {
  grant: "Signup / plan grant",
  topup: "Credit purchase",
  spend: "Generation",
  refund: "Auto-refund",
  rollover: "Rollover",
  expiry: "Expiry",
  adjustment: "Adjustment",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (!user) return null;

  const ledger = await getLedger(user.id, 50);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Billing &amp; credits</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Credits power every generation. Failures auto-refund within minutes.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-right">
          <p className="text-xs text-[var(--color-muted)]">Balance</p>
          <p className="text-2xl font-semibold">{user.creditBalance}</p>
        </div>
      </div>

      {status === "success" && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Payment received — your credits will appear once the payment settles.
        </p>
      )}
      {status === "cancel" && (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
          Checkout canceled — no charge was made.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Buy credits
        </h2>
        <BuyCredits />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Ledger
        </h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No transactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--color-muted)]">
                <tr>
                  {["Date", "Type", "Amount", "Balance"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-4 py-2 text-[var(--color-muted)]">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {REASON_LABEL[row.reason] ?? row.reason}
                    </td>
                    <td
                      className={`px-4 py-2 font-medium ${
                        row.amount >= 0 ? "text-emerald-400" : "text-[var(--color-text)]"
                      }`}
                    >
                      {row.amount >= 0 ? "+" : ""}
                      {row.amount}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-muted)]">
                      {row.balanceAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
