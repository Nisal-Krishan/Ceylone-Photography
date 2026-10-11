"use client";

import { inputCls, labelCls, panelCls } from "@/lib/ui";

export type CustomerForm = {
  customerName: string;
  customerNic: string;
  customerPhone: string;
  customerAddress: string;
  pickupAt: string;
  returnAt: string;
  notes: string;
};

type Props = {
  value: CustomerForm;
  onChange: (patch: Partial<CustomerForm>) => void;
  days: number;
};

const QUICK_DAYS = [1, 2, 3, 7];

export function CustomerPanel({ value, onChange, days }: Props) {
  const setReturnPlusDays = (n: number) => {
    if (!value.pickupAt) return;
    const d = new Date(value.pickupAt);
    d.setDate(d.getDate() + n);
    const pad = (x: number) => String(x).padStart(2, "0");
    onChange({
      returnAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    });
  };

  return (
    <>
      {/* Customer */}
      <section className={`${panelCls} p-4`}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <span className="h-2 w-2 rounded-full bg-red-600" />
          Customer Details
        </h2>
        <div className="grid gap-3">
          <div>
            <label htmlFor="cust-name" className={labelCls}>
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              id="cust-name"
              className={inputCls}
              placeholder="Full name"
              autoComplete="off"
              maxLength={200}
              value={value.customerName}
              onChange={(e) => onChange({ customerName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cust-phone" className={labelCls}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="cust-phone"
                className={inputCls}
                placeholder="07X XXX XXXX"
                inputMode="tel"
                autoComplete="off"
                maxLength={30}
                value={value.customerPhone}
                onChange={(e) => onChange({ customerPhone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="cust-nic" className={labelCls}>
                NIC / ID <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                id="cust-nic"
                className={inputCls}
                placeholder="NIC or passport"
                autoComplete="off"
                maxLength={40}
                value={value.customerNic}
                onChange={(e) => onChange({ customerNic: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="cust-address" className={labelCls}>
              Address <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              id="cust-address"
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="House / street, city"
              autoComplete="off"
              maxLength={500}
              value={value.customerAddress}
              onChange={(e) => onChange({ customerAddress: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Rental */}
      <section className={`${panelCls} p-4`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            Rental Details
          </h2>
          <span className="rounded-md border border-red-600/50 bg-red-600/10 px-2.5 py-1 text-xs font-bold text-red-400">
            {days} {days === 1 ? "DAY" : "DAYS"}
          </span>
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pickup" className={labelCls}>
                Pickup Date &amp; Time
              </label>
              <input
                id="pickup"
                type="datetime-local"
                className={`${inputCls} [color-scheme:dark]`}
                value={value.pickupAt}
                onChange={(e) => onChange({ pickupAt: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="return" className={labelCls}>
                Return Date &amp; Time
              </label>
              <input
                id="return"
                type="datetime-local"
                className={`${inputCls} [color-scheme:dark]`}
                value={value.returnAt}
                onChange={(e) => onChange({ returnAt: e.target.value })}
              />
            </div>
          </div>
          <div>
            <span className={labelCls}>Quick return</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_DAYS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setReturnPlusDays(n)}
                  className="rounded-md border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-red-500 hover:text-white"
                >
                  +{n} {n === 1 ? "day" : "days"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className={`${panelCls} p-4`}>
        <label htmlFor="notes" className={labelCls}>
          Bill Notes <span className="text-zinc-600">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="e.g. Weekend shoot – outdoor, deposit collected in cash"
          maxLength={1000}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </section>
    </>
  );
}
