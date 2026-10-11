import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bills } from "@/db/schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Permanently delete a bill. Its item lines and payment history are removed
 * automatically (ON DELETE CASCADE). Used from Saved Bills management.
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const billId = Number((await params).id);
  if (!Number.isInteger(billId) || billId <= 0) {
    return NextResponse.json({ error: "Invalid bill id" }, { status: 400 });
  }

  const deleted = await db.delete(bills).where(eq(bills.id, billId)).returning({ id: bills.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
