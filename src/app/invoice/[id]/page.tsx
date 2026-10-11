import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { billItems, bills, payments } from "@/db/schema";
import { getBusinessSettings } from "@/lib/settings";
import { InvoiceActions } from "@/components/invoice/InvoiceActions";
import { InvoicePaper, type InvoiceData } from "@/components/invoice/InvoicePaper";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const billId = Number(id);
  if (!Number.isInteger(billId) || billId <= 0) notFound();

  const [bill] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
  if (!bill) notFound();

  const [business, lineRows, paymentRows] = await Promise.all([
    getBusinessSettings(),
    db.select().from(billItems).where(eq(billItems.billId, billId)).orderBy(asc(billItems.id)),
    db
      .select()
      .from(payments)
      .where(eq(payments.billId, billId))
      .orderBy(asc(payments.paidAt), asc(payments.id)),
  ]);

  const inv: InvoiceData = {
    billNo: bill.billNo,
    createdAt: bill.createdAt,
    customerName: bill.customerName,
    customerNic: bill.customerNic,
    customerPhone: bill.customerPhone,
    customerAddress: bill.customerAddress,
    pickupAt: bill.pickupAt,
    returnAt: bill.returnAt,
    days: bill.days,
    notes: bill.notes,
    subtotal: Number(bill.subtotal),
    paid: Number(bill.paid),
    balance: Number(bill.balance),
    status: bill.status,
    lines: lineRows.map((l) => ({
      id: l.id,
      itemName: l.itemName,
      description: l.description,
      category: l.category,
      qty: l.qty,
      rate: Number(l.rate),
      defaultRate: Number(l.defaultRate),
      days: l.days,
      lineTotal: Number(l.lineTotal),
    })),
    payments: paymentRows.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      paidAt: p.paidAt,
    })),
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-zinc-900 px-4 py-8 print:bg-white print:p-0">
      <InvoiceActions billId={bill.id} balance={inv.balance} autoPrint={sp.print === "1"} />
      <InvoicePaper inv={inv} business={business} />
    </div>
  );
}
