"use client";

import { useState, useTransition } from "react";
import { buyCreditsAction } from "@/server/actions";
import { CREDIT_PACK_LIST } from "@/lib/billing/packs";

/** Credit-pack purchase grid → Stripe Checkout (Module 24.1). */
export function BuyCredits() {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CREDIT_PACK_LIST.map((pack) => (
          <div
            key={pack.key}
            className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <h3 className="font-medium text-[var(--color-accent)]">
              {pack.label}
            </h3>
            <p className="mt-1 text-2xl font-semibold">
              {pack.credits.toLocaleString()}
              <span className="text-sm font-normal text-[var(--color-muted)]">
                {" "}
                credits
              </span>
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              ${(pack.amountCents / 100).toFixed(2)}
            </p>
            <button
              disabled={pendingKey !== null}
              onClick={() => {
                setError(null);
                setPendingKey(pack.key);
                start(async () => {
                  try {
                    const url = await buyCreditsAction(pack.key);
                    window.location.href = url;
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Checkout failed.",
                    );
                    setPendingKey(null);
                  }
                });
              }}
              className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {pendingKey === pack.key ? "Redirecting…" : "Buy"}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
