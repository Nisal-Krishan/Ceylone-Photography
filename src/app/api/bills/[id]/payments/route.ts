import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bills, payments } from "@/db/schema";
import { parsePaymentBody } from "@/lib/api";
import { paymentStatus, round2 } from "@/lib/billing";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Record an additional payment (e.g. balance collected at return). */
export async function POST(req: Request, { params }: Ctx) {
  const billId = Number((await params).id);
  if (!Number.isInteger(billId) || billId <= 0) {
    return NextResponse.json({ error: "Invalid bill id" }, { status: 400 });
  }

  const parsed = parsePaymentBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const result = await db.transaction(async (tx) => {
    const [bill] = await tx.select().from(bills).where(eq(bills.id, billId)).limit(1).for("update");
    if (!bill) return { error: "Bill not found", status: 404 as const };

    const subtotal = Number(bill.subtotal);
    const alreadyPaid = Number(bill.paid);
    const due = round2(Math.max(0, subtotal - alreadyPaid));
    if (due <= 0) return { error: "This bill is already fully paid", status: 400 as const };

    const amount = Math.min(parsed.data.amount, due);
    const newPaid = round2(alreadyPaid + amount);
    const newBalance = round2(Math.max(0, subtotal - newPaid));

    await tx.insert(payments).values({
      billId,
      method: parsed.data.method,
      amount: String(amount),
    });
    await tx
      .update(bills)
      .set({
        paid: String(newPaid),
        balance: String(newBalance),
        status: paymentStatus(subtotal, newPaid),
      })
      .where(eq(bills.id, billId));

    return { amount, balance: newBalance };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, ...result });
}
