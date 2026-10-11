"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PrinterIcon, SearchIcon, TrashIcon } from "@/components/ui/Icons";
import { formatDateTime, formatMoney, round2 } from "@/lib/billing";
import { inputCls, panelCls } from "@/lib/ui";

export type SavedBill = {
  id: number;
  billNo: number;
  customerName: string;
  customerPhone: string;
  customerNic: string;
  pickupAt: string;
  returnAt: string;
  days: number;
  subtotal: number;
  paid: number;
  balance: number;
  status: string;
  createdAt: string;
};

type StatusFilter = "ALL" | "PAID" | "PARTIAL" | "UNPAID";

const STATUS_STYLE: Record<string, string> = {
  PAID: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  PARTIAL: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  UNPAID: "border-red-500/50 bg-red-500/10 text-red-300",
};

const FILTERS: StatusFilter[] = ["ALL", "PAID", "PARTIAL", "UNPAID"];

export function SavedBills() {
  const [bills, setBills] = useState<SavedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/bills", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBills(d.bills ?? []))
      .catch(() => setToast({ type: "err", text: "Could not load saved bills" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { ALL: bills.length, PAID: 0, PARTIAL: 0, UNPAID: 0 };
    for (const b of bills) {
      if (b.status === "PAID" || b.status === "PARTIAL" || b.status === "UNPAID") c[b.status] += 1;
    }
    return c;
  }, [bills]);

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return bills.filter((b) => {
      if (status !== "ALL" && b.status !== status) return false;
      const hay = `${b.billNo} ${b.customerName} ${b.customerPhone} ${b.customerNic}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [bills, query, status]);

  const totals = useMemo(
    () =>
      bills.reduce(
        (acc, b) => {
          acc.billed += b.subtotal;
          acc.collected += b.paid;
          acc.outstanding += b.balance;
          return acc;
        },
        { billed: 0, collected: 0, outstanding: 0 },
      ),
    [bills],
  );

  const remove = async (bill: SavedBill) => {
    if (
      !window.confirm(
        `Delete bill #${bill.billNo} (${bill.customerName}) permanently?\n\nIts item lines and payment history will also be removed.`,
      )
    ) {
      return;
    }
    setDeletingId(bill.id);
    try {
      const res = await fetch(`/api/bills/${bill.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the bill");
      setBills((prev) => prev.filter((b) => b.id !== bill.id));
      setToast({ type: "ok", text: `Bill #${bill.billNo} deleted` });
    } catch (err) {
      setToast({ type: "err", text: err instanceof Error ? err.message : "Could not delete the bill" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">SAVED BILLS</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Bill management · {bills.length} saved
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500"
        >
          + New Bill
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Billed (Rs.)" value={formatMoney(round2(totals.billed))} />
        <Stat label="Collected (Rs.)" value={formatMoney(round2(totals.collected))} />
        <Stat label="Outstanding (Rs.)" value={formatMoney(round2(totals.outstanding))} accent />
      </div>

      <div className={`${panelCls} flex flex-col gap-4 p-4`}>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className={`${inputCls} py-2.5 pl-10`}
            placeholder="Search by bill no, customer name, phone or NIC…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                status === f
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500 hover:text-white"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className={`${panelCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead className="bg-zinc-900 text-[11px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Bill No</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Date</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Customer</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Pickup → Return</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Total (Rs.)</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Paid (Rs.)</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Balance (Rs.)</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-center font-semibold">Status</th>
                <th className="border-b border-zinc-800 px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    Loading saved bills…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    {bills.length === 0
                      ? "No bills yet. Create your first bill from the POS Terminal."
                      : "No bills match your search."}
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id} className="transition hover:bg-zinc-800/40">
                  <td className="border-b border-zinc-800/70 px-4 py-3 font-mono font-bold text-white">{b.billNo}</td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 whitespace-nowrap text-zinc-400">
                    {formatDateTime(b.createdAt)}
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3">
                    <div className="font-semibold text-zinc-100">{b.customerName}</div>
                    <div className="text-xs text-zinc-500">{b.customerPhone}</div>
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 whitespace-nowrap text-xs text-zinc-400">
                    {formatDateTime(b.pickupAt)}
                    <br />→ {formatDateTime(b.returnAt)} <span className="text-zinc-500">({b.days}d)</span>
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-right tabular-nums">
                    {formatMoney(b.subtotal)}
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-right tabular-nums">{formatMoney(b.paid)}</td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-right font-bold tabular-nums text-white">
                    {formatMoney(b.balance)}
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3 text-center">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${STATUS_STYLE[b.status] ?? ""}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="border-b border-zinc-800/70 px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/invoice/${b.id}`}
                        className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-red-500 hover:text-white"
                      >
                        View
                      </Link>
                      <Link
                        href={`/invoice/${b.id}?print=1`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Print bill ${b.billNo}`}
                        title="Print invoice"
                        className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-400 transition hover:border-red-500 hover:text-white"
                      >
                        <PrinterIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(b)}
                        disabled={deletingId === b.id}
                        aria-label={`Delete bill ${b.billNo}`}
                        title="Delete bill"
                        className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:bg-red-600/15 hover:text-red-500 disabled:opacity-40"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl ${
            toast.type === "ok"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-300"
              : "border-red-500/50 bg-red-950 text-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${panelCls} p-5`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-black tabular-nums ${accent ? "text-red-500" : "text-white"}`}>{value}</p>
    </div>
  );
}
