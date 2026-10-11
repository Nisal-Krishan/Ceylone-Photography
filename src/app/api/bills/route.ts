import { NextResponse } from "next/server";
import { desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { bills, billItems, items, payments } from "@/db/schema";
import { parseBillBody, serializeBill } from "@/lib/api";
import { FIRST_BILL_NO, calcDays, lineTotal, paymentStatus, round2 } from "@/lib/billing";

export const dynamic = "force-dynamic";

/** Recent bills + the next invoice number that will be issued. */
export async function GET() {
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${bills.billNo}), ${FIRST_BILL_NO - 1}) + 1` })
    .from(bills);

  const rows = await db.select().from(bills).orderBy(desc(bills.billNo)).limit(300);
  return NextResponse.json({
    nextBillNo: Number(next),
    bills: rows.map(serializeBill),
  });
}

/**
 * Save a bill. Totals are always recalculated on the server:
 * line total = qty × rate × rental days, using the custom rate for this bill.
 */
export async function POST(req: Request) {
  const parsed = parseBillBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;

  const days = calcDays(input.pickupAt, input.returnAt);
  const lines = input.items.map((l) => ({ ...l, lineTotal: lineTotal(l.qty, l.rate, days) }));
  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  const paid = Math.min(input.paid, subtotal);
  const balance = round2(Math.max(0, subtotal - paid));
  const status = paymentStatus(subtotal, paid);

  const result = await db.transaction(async (tx) => {
    // Lock the table while numbering so two cashiers can never get the same bill no.
    await tx.execute(sql`LOCK TABLE "bills" IN EXCLUSIVE MODE`);

    const [{ next }] = await tx
      .select({ next: sql<number>`coalesce(max(${bills.billNo}), ${FIRST_BILL_NO - 1}) + 1` })
      .from(bills);

    // Items deleted from the catalogue after being added to the cart keep
    // their snapshot on the bill (itemId falls back to null instead of failing).
    const wanted = [...new Set(lines.map((l) => l.itemId).filter((x): x is number => x !== null))];
    let existing = new Set<number>();
    if (wanted.length > 0) {
      const rows = await tx.select({ id: items.id }).from(items).where(inArray(items.id, wanted));
      existing = new Set(rows.map((r) => r.id));
    }

    const [bill] = await tx
      .insert(bills)
      .values({
        billNo: Number(next),
        customerName: input.customerName,
        customerNic: input.customerNic,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        pickupAt: input.pickupAt,
        returnAt: input.returnAt,
        days,
        notes: input.notes,
        subtotal: String(subtotal),
        paid: String(paid),
        balance: String(balance),
        status,
      })
      .returning({ id: bills.id, billNo: bills.billNo });

    await tx.insert(billItems).values(
      lines.map((l) => ({
        billId: bill.id,
        itemId: l.itemId !== null && existing.has(l.itemId) ? l.itemId : null,
        itemName: l.name,
        description: l.description,
        category: l.category,
        qty: l.qty,
        defaultRate: String(l.defaultRate),
        rate: String(l.rate),
        days,
        lineTotal: String(l.lineTotal),
      })),
    );

    if (paid > 0) {
      await tx.insert(payments).values({
        billId: bill.id,
        method: input.paymentMethod,
        amount: String(paid),
      });
    }

    return bill;
  });

  const [{ next: nextBillNo }] = await db
    .select({ next: sql<number>`coalesce(max(${bills.billNo}), ${FIRST_BILL_NO - 1}) + 1` })
    .from(bills);

  return NextResponse.json(
    { id: result.id, billNo: result.billNo, nextBillNo: Number(nextBillNo) },
    { status: 201 },
  );
}
