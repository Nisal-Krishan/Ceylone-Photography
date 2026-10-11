// Presentational invoice (server-rendered). Styled as a white A4 sheet for printing.
import { CameraLogo } from "@/components/ui/Icons";
import type { BusinessInfo } from "@/lib/business";
import { CURRENCY, PAYMENT_LABELS, formatDateOnly, formatDateTime, formatMoney, type PaymentMethod } from "@/lib/billing";

export type InvoiceLine = {
  id: number;
  itemName: string;
  description: string;
  category: string;
  qty: number;
  rate: number;
  defaultRate: number;
  days: number;
  lineTotal: number;
};

export type InvoicePayment = {
  id: number;
  method: string;
  amount: number;
  paidAt: Date;
};

export type InvoiceData = {
  billNo: number;
  createdAt: Date;
  customerName: string;
  customerNic: string;
  customerPhone: string;
  customerAddress: string;
  pickupAt: Date;
  returnAt: Date;
  days: number;
  notes: string;
  subtotal: number;
  paid: number;
  balance: number;
  status: string;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
};

const dash = (s: string) => (s.trim() ? s : "—");

function BrandName({ name }: { name: string }) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 3) {
    return (
      <>
        {words[0]} <span className="text-red-600">{words[1]}</span> {words[2]}
      </>
    );
  }
  return <>{name}</>;
}

export function InvoicePaper({ inv, business }: { inv: InvoiceData; business: BusinessInfo }) {
  const hasNotes = inv.notes.trim().length > 0;
  const hasAddress = inv.customerAddress.trim().length > 0;

  return (
    <article className="invoice-paper mx-auto w-full max-w-[820px] bg-white p-8 text-zinc-900 shadow-2xl sm:p-10 print:max-w-none print:p-0 print:shadow-none">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-red-600 pb-5">
        <div className="flex items-start gap-4">
          <CameraLogo className="h-16 w-16 shrink-0 text-red-600" />
          <div>
            <h1 className="text-3xl font-black leading-none tracking-tight text-zinc-900">
              <BrandName name={business.name} />
            </h1>
            {business.tagline && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">{business.tagline}</p>
            )}
            <div className="mt-3 space-y-0.5 text-[12px] text-zinc-700">
              {business.addressLines.map((l) => (
                <p key={l}>{l}</p>
              ))}
              {business.phones.length > 0 && <p>Tel: {business.phones.join(" / ")}</p>}
              {business.email && <p>Email: {business.email}</p>}
            </div>
          </div>
        </div>

        <div className="min-w-[200px] text-right">
          <p className="text-2xl font-black uppercase tracking-wide text-red-600">Invoice</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-zinc-500">Invoice No:</dt>
            <dd className="font-mono text-base font-bold">{inv.billNo}</dd>
            <dt className="text-zinc-500">Date:</dt>
            <dd className="font-semibold">{formatDateTime(inv.createdAt)}</dd>
          </dl>
        </div>
      </header>

      {/* Bill To & Rental Details */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-300 p-4">
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Bill To</h2>
          <p className="text-base font-bold">{inv.customerName}</p>
          {hasAddress && <p className="whitespace-pre-line text-sm text-zinc-700">{inv.customerAddress}</p>}
          {inv.customerNic && (
            <p className="text-sm text-zinc-700">
              NIC / ID: <span className="font-semibold">{inv.customerNic}</span>
            </p>
          )}
          <p className="text-sm text-zinc-700">
            Phone: <span className="font-semibold">{inv.customerPhone}</span>
          </p>
        </div>

        <div className="rounded-lg border border-zinc-300 p-4">
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Rental Details</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-zinc-500">Pickup:</dt>
            <dd className="font-semibold">{formatDateTime(inv.pickupAt)}</dd>
            <dt className="text-zinc-500">Return:</dt>
            <dd className="font-semibold">{formatDateTime(inv.returnAt)}</dd>
            <dt className="text-zinc-500">Duration:</dt>
            <dd className="font-semibold">
              {inv.days} {inv.days === 1 ? "day" : "days"}
            </dd>
          </dl>
        </div>
      </section>

      {/* Item table */}
      <section className="mt-6 overflow-hidden rounded-lg border border-zinc-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-[11px] uppercase tracking-wider text-white print:bg-zinc-900">
              <th className="px-3 py-2.5 text-left font-semibold">#</th>
              <th className="px-3 py-2.5 text-left font-semibold">Item &amp; Description</th>
              <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
              <th className="px-3 py-2.5 text-right font-semibold">Rate ({CURRENCY})</th>
              <th className="px-3 py-2.5 text-center font-semibold">Days</th>
              <th className="px-3 py-2.5 text-right font-semibold">Total ({CURRENCY})</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => {
              const custom = Math.abs(l.rate - l.defaultRate) > 0.001;
              return (
                <tr key={l.id} className="border-t border-zinc-200 align-top">
                  <td className="px-3 py-2.5 text-zinc-500">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-zinc-900">{l.itemName}</div>
                    {l.description && <div className="text-xs text-zinc-500">{l.description}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">{l.qty}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(l.rate)}
                    {custom && <div className="text-[10px] font-semibold uppercase text-zinc-500">custom</div>}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">{l.days}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(l.lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Summary */}
      <section className="mt-5 flex flex-wrap justify-between gap-6">
        <div className="min-w-0 flex-1 text-xs text-zinc-600">
          {hasNotes && (
            <>
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-800">Notes</p>
              <p className="whitespace-pre-line">{inv.notes}</p>
            </>
          )}
        </div>
        <div className="w-full max-w-[300px] space-y-2 text-sm">
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-600">Sub-total ({CURRENCY})</span>
            <span className="font-semibold tabular-nums">{formatMoney(inv.subtotal)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-600">Paid ({CURRENCY})</span>
            <span className="font-semibold tabular-nums">{formatMoney(inv.paid)}</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-red-600 px-4 py-3 text-white">
            <span className="text-xs font-black uppercase tracking-wider">Balance Due ({CURRENCY})</span>
            <span className="text-xl font-black tabular-nums">{formatMoney(inv.balance)}</span>
          </div>
          <p className="text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Status: {inv.status}
          </p>
        </div>
      </section>

      {/* Footer: payments & bank */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-300 p-4">
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Payment History</h2>
          {inv.payments.length === 0 ? (
            <p className="text-sm text-zinc-500">No payments recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-300 text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="py-1.5 text-left font-semibold">Date</th>
                  <th className="py-1.5 text-left font-semibold">Method</th>
                  <th className="py-1.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.payments.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100">
                    <td className="py-1.5 text-zinc-700">{formatDateOnly(p.paidAt)}</td>
                    <td className="py-1.5 text-zinc-700">{PAYMENT_LABELS[p.method as PaymentMethod] ?? p.method}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-zinc-300 p-4">
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Bank Transfer Details</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-zinc-500">Bank:</dt>
            <dd className="font-semibold">{dash(business.bank.bankName)}</dd>
            <dt className="text-zinc-500">Branch:</dt>
            <dd className="font-semibold">{dash(business.bank.branch)}</dd>
            <dt className="text-zinc-500">Account Name:</dt>
            <dd className="font-semibold">{dash(business.bank.accountName)}</dd>
            <dt className="text-zinc-500">Account No:</dt>
            <dd className="font-mono font-semibold">{dash(business.bank.accountNumber)}</dd>
          </dl>
        </div>
      </section>

      <footer className="mt-8 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
        {business.invoiceFooter && <p>{business.invoiceFooter}</p>}
        <p className="mt-1 font-semibold uppercase tracking-[0.2em] text-zinc-400">{business.name}</p>
      </footer>
    </article>
  );
}
