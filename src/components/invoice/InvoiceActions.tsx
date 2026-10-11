"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { PrinterIcon } from "@/components/ui/Icons";
import { PAYMENT_LABELS, PAYMENT_METHODS, formatMoney, type PaymentMethod } from "@/lib/billing";
import { btnGhost, btnPrimary, inputCls, labelCls } from "@/lib/ui";

type Props = {
  billId: number;
  balance: number;
  autoPrint: boolean;
};

export function InvoiceActions({ billId, balance, autoPrint }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAmount(balance);
  }, [balance]);

  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [autoPrint]);

  const recordPayment = async () => {
    setError("");
    if (!(amount > 0)) return setError("Enter an amount greater than 0");
    setBusy(true);
    try {
      const res = await fetch(`/api/bills/${billId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not record the payment");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mb-6 flex max-w-[820px] flex-wrap items-end justify-between gap-4 print:hidden">
      <div className="flex gap-2">
        <Link href="/" className={btnGhost}>
          ← New Bill
        </Link>
        <Link href="/bills" className={btnGhost}>
          All Bills
        </Link>
        <button type="button" onClick={() => window.print()} className={btnPrimary}>
          <PrinterIcon className="h-4 w-4" />
          Print
        </button>
      </div>

      {balance > 0 ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
          <div>
            <span className={labelCls}>Collect balance (Rs.)</span>
            <NumberField value={amount} onCommit={setAmount} className="w-32 text-right text-base" />
          </div>
          <div>
            <label htmlFor="pay-method" className={labelCls}>
              Method
            </label>
            <select
              id="pay-method"
              className={`${inputCls} w-36`}
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={recordPayment} disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Record Payment"}
          </button>
          {error && <p className="w-full text-xs font-semibold text-red-400">{error}</p>}
        </div>
      ) : (
        <span className="rounded-lg border border-emerald-500/40 bg-emerald-950 px-4 py-2 text-sm font-bold text-emerald-300">
          Fully paid · Rs. {formatMoney(0)} due
        </span>
      )}
    </div>
  );
}
