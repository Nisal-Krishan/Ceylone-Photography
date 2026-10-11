"use client";

import { NumberField } from "@/components/ui/NumberField";
import { MinusIcon, PencilIcon, PlusIcon, ResetIcon, TrashIcon, CartIcon } from "@/components/ui/Icons";
import { MAX_QTY, formatMoney, lineTotal, type CartLine } from "@/lib/billing";

type Props = {
  cart: CartLine[];
  days: number;
  onQty: (uid: string, qty: number) => void;
  onRate: (uid: string, rate: number) => void;
  onRemove: (uid: string) => void;
};

const qtyBtn =
  "grid h-8 w-8 place-items-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 transition hover:border-red-500 hover:bg-red-600 hover:text-white disabled:opacity-40";

export function CartTable({ cart, days, onQty, onRate, onRemove }: Props) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <CartIcon className="h-12 w-12 text-zinc-700" />
        <p className="text-base font-semibold text-zinc-400">No items in this bill yet</p>
        <p className="max-w-sm text-sm text-zinc-600">
          Search for a camera, lens, battery or accessory above (press <kbd className="rounded border border-zinc-700 px-1 font-mono text-xs">F1</kbd>) or pick a category to add it here.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-zinc-900 text-[11px] uppercase tracking-wider text-zinc-400">
          <tr>
            <th className="border-b border-zinc-800 px-3 py-3 text-left font-semibold">#</th>
            <th className="border-b border-zinc-800 px-3 py-3 text-left font-semibold">Item &amp; Description</th>
            <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Qty</th>
            <th className="border-b border-zinc-800 px-3 py-3 text-right font-semibold">Rate (Rs.)</th>
            <th className="border-b border-zinc-800 px-3 py-3 text-right font-semibold">Total (Rs.)</th>
            <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((l, i) => {
            const total = lineTotal(l.qty, l.rate, days);
            const isCustom = l.rate !== l.defaultRate;
            return (
              <tr key={l.uid} className="group transition hover:bg-zinc-800/40">
                <td className="border-b border-zinc-800/80 px-3 py-3 align-middle text-zinc-500">{i + 1}</td>

                <td className="border-b border-zinc-800/80 px-3 py-3 align-middle">
                  <div className="font-semibold text-zinc-100">{l.name}</div>
                  <div className="text-xs text-zinc-500">{l.description || l.category}</div>
                </td>

                <td className="border-b border-zinc-800/80 px-3 py-3 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className={qtyBtn}
                      disabled={l.qty <= 1}
                      onClick={() => onQty(l.uid, Math.max(1, l.qty - 1))}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <NumberField
                      mode="int"
                      value={l.qty}
                      min={1}
                      max={MAX_QTY}
                      onCommit={(n) => onQty(l.uid, n)}
                      className="w-14 text-center"
                    />
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className={qtyBtn}
                      disabled={l.qty >= MAX_QTY}
                      onClick={() => onQty(l.uid, Math.min(MAX_QTY, l.qty + 1))}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>

                <td className="border-b border-zinc-800/80 px-3 py-3 align-middle">
                  <div className="flex items-center justify-end gap-1.5">
                    <NumberField
                      id={`rate-${l.uid}`}
                      value={l.rate}
                      onCommit={(n) => onRate(l.uid, n)}
                      title="Click to set a custom rate for this bill"
                      className={`w-32 text-right ${isCustom ? "border-amber-500/60 text-amber-300" : ""}`}
                    />
                    <button
                      type="button"
                      aria-label="Edit rate"
                      title="Edit rate"
                      onClick={() => document.getElementById(`rate-${l.uid}`)?.focus()}
                      className="grid h-8 w-8 place-items-center rounded-md border border-zinc-700 text-zinc-300 transition hover:border-red-500 hover:text-red-400"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {isCustom && (
                    <div className="mt-1 flex items-center justify-end gap-2 text-[11px]">
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-bold tracking-wide text-amber-400">
                        CUSTOM RATE
                      </span>
                      <button
                        type="button"
                        onClick={() => onRate(l.uid, l.defaultRate)}
                        className="inline-flex items-center gap-1 text-zinc-400 hover:text-white"
                      >
                        <ResetIcon className="h-3 w-3" />
                        {formatMoney(l.defaultRate)}
                      </button>
                    </div>
                  )}
                </td>

                <td className="border-b border-zinc-800/80 px-3 py-3 text-right align-middle">
                  <div className="text-base font-bold tabular-nums text-white">{formatMoney(total)}</div>
                  <div className="text-[11px] tabular-nums text-zinc-500">
                    {l.qty} × {formatMoney(l.rate)} × {days} {days === 1 ? "day" : "days"}
                  </div>
                </td>

                <td className="border-b border-zinc-800/80 px-3 py-3 text-center align-middle">
                  <button
                    type="button"
                    aria-label="Remove item"
                    title="Remove from bill"
                    onClick={() => onRemove(l.uid)}
                    className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-red-600/15 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
