"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartTable } from "@/components/pos/CartTable";
import { CustomerPanel, type CustomerForm } from "@/components/pos/CustomerPanel";
import { ItemSearch } from "@/components/pos/ItemSearch";
import { NumberField } from "@/components/ui/NumberField";
import { CartIcon, PrinterIcon, ResetIcon, SaveIcon, XIcon } from "@/components/ui/Icons";
import {
  FIRST_BILL_NO,
  MAX_QTY,
  PAYMENT_LABELS,
  PAYMENT_METHODS,
  calcDays,
  formatMoney,
  lineTotal,
  round2,
  toLocalInputValue,
  type CartLine,
  type Category,
  type ItemDto,
  type PaymentMethod,
} from "@/lib/billing";
import { btnGhost, btnPrimary, labelCls, panelCls } from "@/lib/ui";

type Toast = { type: "ok" | "err"; text: string } | null;

const blankCustomer = (): CustomerForm => ({
  customerName: "",
  customerNic: "",
  customerPhone: "",
  customerAddress: "",
  pickupAt: "",
  returnAt: "",
  notes: "",
});

/** Pickup = now (rounded to the minute), return = pickup + 1 day. */
function defaultRentalDates() {
  const now = new Date();
  now.setSeconds(0, 0);
  const ret = new Date(now.getTime() + 86_400_000);
  return { pickupAt: toLocalInputValue(now), returnAt: toLocalInputValue(ret) };
}

export function PosTerminal() {
  const [items, setItems] = useState<ItemDto[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerForm>(blankCustomer);
  const [paid, setPaid] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [billNo, setBillNo] = useState<number>(FIRST_BILL_NO);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [lastSaved, setLastSaved] = useState<{ id: number; billNo: number } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const paidRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef(0);

  const days = useMemo(
    () =>
      customer.pickupAt && customer.returnAt
        ? calcDays(new Date(customer.pickupAt), new Date(customer.returnAt))
        : 1,
    [customer.pickupAt, customer.returnAt],
  );
  const subtotal = useMemo(
    () => round2(cart.reduce((sum, l) => sum + lineTotal(l.qty, l.rate, days), 0)),
    [cart, days],
  );
  const balance = Math.max(0, round2(subtotal - paid));
  const change = Math.max(0, round2(paid - subtotal));
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  const flash = useCallback((type: "ok" | "err", text: string) => setToast({ type, text }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Initial load: default rental dates, catalogue and next bill number.
  useEffect(() => {
    setCustomer((c) => ({ ...c, ...defaultRentalDates() }));
    fetch("/api/items", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => flash("err", "Could not load the item list"));
    fetch("/api/bills", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.nextBillNo) setBillNo(d.nextBillNo);
      })
      .catch(() => {});
    searchRef.current?.focus();
  }, [flash]);

  const addItem = useCallback((item: ItemDto) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.itemId === item.id);
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
      }
      uidRef.current += 1;
      return [
        ...prev,
        {
          uid: `line-${uidRef.current}`,
          itemId: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          defaultRate: item.defaultRate,
          rate: item.defaultRate,
          qty: 1,
        },
      ];
    });
  }, []);

  const updateLine = useCallback((uid: string, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  }, []);

  const removeLine = useCallback((uid: string) => {
    setCart((prev) => prev.filter((l) => l.uid !== uid));
  }, []);

  const resetBill = useCallback((nextNo?: number) => {
    setCart([]);
    setCustomer({ ...blankCustomer(), ...defaultRentalDates() });
    setPaid(0);
    setMethod("CASH");
    if (nextNo) setBillNo(nextNo);
    setTimeout(() => searchRef.current?.focus(), 0);
  }, []);

  const clearCart = () => {
    if (cart.length === 0) return;
    if (!window.confirm("Remove all items from this bill?")) return;
    setCart([]);
    setPaid(0);
    setLastSaved(null);
  };

  const newBill = () => {
    if ((cart.length > 0 || customer.customerName) && !window.confirm("Start a new bill? Current entries will be discarded.")) {
      return;
    }
    resetBill();
    setLastSaved(null);
  };

  const save = async (printAfter: boolean) => {
    if (saving) return;
    if (cart.length === 0) return flash("err", "Add at least one item to the bill");
    if (!customer.customerName.trim()) return flash("err", "Enter the customer name");
    if (!customer.customerPhone.trim()) return flash("err", "Enter the customer phone number");
    if (!customer.pickupAt || !customer.returnAt) return flash("err", "Set the pickup and return date & time");
    if (new Date(customer.returnAt) < new Date(customer.pickupAt)) {
      return flash("err", "Return date must be after the pickup date");
    }

    // Open the print window synchronously so browsers don't block it.
    const printWin = printAfter ? window.open("about:blank", "_blank") : null;
    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.customerName,
          customerNic: customer.customerNic,
          customerPhone: customer.customerPhone,
          customerAddress: customer.customerAddress,
          pickupAt: new Date(customer.pickupAt).toISOString(),
          returnAt: new Date(customer.returnAt).toISOString(),
          notes: customer.notes,
          paid: Math.min(paid, subtotal),
          paymentMethod: method,
          items: cart.map((l) => ({
            itemId: l.itemId,
            name: l.name,
            description: l.description,
            category: l.category,
            defaultRate: l.defaultRate,
            rate: l.rate,
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the bill");

      flash("ok", `Bill #${data.billNo} saved${printAfter ? " — opening invoice" : ""}`);
      setLastSaved({ id: data.id, billNo: data.billNo });
      if (printAfter) {
        const url = `/invoice/${data.id}?print=1`;
        if (printWin) printWin.location.href = url;
        else window.open(url, "_blank");
      }
      resetBill(data.nextBillNo);
    } catch (err) {
      printWin?.close();
      flash("err", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts: F1 search · F5 print · F6 save · F7 paid amount.
  // saveRef keeps a single listener registered while always calling the latest save.
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F5") {
        e.preventDefault();
        void saveRef.current(true);
      } else if (e.key === "F6") {
        e.preventDefault();
        void saveRef.current(false);
      } else if (e.key === "F7") {
        e.preventDefault();
        paidRef.current?.focus();
        paidRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto grid max-w-[1800px] gap-4 p-4 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ---------- LEFT: search + cart ---------- */}
      <section className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">POS TERMINAL</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Create bills for rentals &amp; sales</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Bill No</span>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-lg font-bold tabular-nums text-white">
              {billNo}
            </div>
          </div>
        </div>

        {lastSaved && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <p className="text-sm font-bold text-emerald-200">Bill #{lastSaved.billNo} saved successfully</p>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/invoice/${lastSaved.id}`}
                className="rounded-lg border border-emerald-500/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20"
              >
                View Invoice
              </Link>
              <Link
                href={`/invoice/${lastSaved.id}?print=1`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-emerald-500"
              >
                Print
              </Link>
              <button
                type="button"
                onClick={() => setLastSaved(null)}
                aria-label="Dismiss"
                className="grid h-8 w-8 place-items-center rounded-md text-emerald-300/70 transition hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className={`${panelCls} p-4`}>
          <ItemSearch
            items={items}
            category={category}
            onCategory={setCategory}
            onPick={addItem}
            inputRef={searchRef}
          />
        </div>

        <div className={`${panelCls} flex min-h-[420px] flex-1 flex-col overflow-hidden lg:min-h-0`}>
          {/* Cart header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <CartIcon className="h-6 w-6 text-red-600" />
              <div>
                <h2 className="text-base font-black uppercase tracking-wide text-white">Cart Area</h2>
                <p className="text-xs text-zinc-500">
                  {cart.length} {cart.length === 1 ? "line" : "lines"} · {itemCount} {itemCount === 1 ? "unit" : "units"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={clearCart} disabled={cart.length === 0} className={btnGhost}>
                Clear Cart
              </button>
              <button type="button" onClick={newBill} className={btnPrimary}>
                <ResetIcon className="h-4 w-4" />
                New Bill
              </button>
            </div>
          </div>

          <CartTable
            cart={cart}
            days={days}
            onQty={(uid, qty) => updateLine(uid, { qty })}
            onRate={(uid, rate) => updateLine(uid, { rate })}
            onRemove={removeLine}
          />

          {/* Totals + actions */}
          <div className="grid gap-3 border-t border-zinc-800 bg-zinc-950/60 p-4 xl:grid-cols-[minmax(0,1fr)_230px]">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Total (Rs.)</span>
                  <span className="text-lg font-bold tabular-nums text-white">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="paid" className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Paid (Rs.) <kbd className="ml-1 rounded border border-zinc-700 px-1 font-mono text-[10px] text-zinc-500">F7</kbd>
                  </label>
                  <div className="flex items-center gap-2">
                    <NumberField
                      id="paid"
                      inputRef={paidRef}
                      value={paid}
                      onCommit={(n) => setPaid(n)}
                      className="w-32 text-right text-base"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Method</span>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-32 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm font-semibold text-zinc-100 focus:border-red-500 focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col justify-center rounded-lg bg-red-600 px-5 py-4 text-white shadow-lg shadow-red-900/40">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-red-100">Balance Due (Rs.)</span>
                <span className="text-3xl font-black tabular-nums">{formatMoney(balance)}</span>
                {change > 0 && (
                  <span className="mt-1 text-xs font-semibold text-red-100">Change: Rs. {formatMoney(change)}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 xl:flex xl:flex-col">
              <button type="button" onClick={() => save(true)} disabled={saving} className={`${btnPrimary} py-3.5`}>
                <PrinterIcon className="h-4 w-4" />
                Print Invoice
                <kbd className="ml-auto rounded bg-black/20 px-1.5 font-mono text-[10px]">F5</kbd>
              </button>
              <button type="button" onClick={() => save(false)} disabled={saving} className={`${btnGhost} py-3.5`}>
                <SaveIcon className="h-4 w-4" />
                Save Bill
                <kbd className="ml-auto rounded border border-zinc-600 px-1.5 font-mono text-[10px] text-zinc-400">F6</kbd>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- RIGHT: customer & rental ---------- */}
      <aside className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
        <CustomerPanel
          value={customer}
          days={days}
          onChange={(patch) => setCustomer((c) => ({ ...c, ...patch }))}
        />
        <p className={labelCls + " px-1 normal-case tracking-normal text-zinc-600"}>
          Tip: Click any Rate in the cart to set a custom price for this bill only. Changing defaults is done on the Items page.
        </p>
      </aside>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-5 py-3 text-sm font-semibold shadow-2xl ${
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
