import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessSettings } from "@/db/schema";
import { parseSettingsBody } from "@/lib/api";
import { getBusinessSettings, rowToBusiness, settingsInputToRow } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Read the shop details printed on invoices (creates defaults on first use). */
export async function GET() {
  const business = await getBusinessSettings();
  return NextResponse.json({ business });
}

/** Update the shop details from the Settings page. */
export async function PUT(req: Request) {
  const parsed = parseSettingsBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const existing = await db.select({ id: businessSettings.id }).from(businessSettings).limit(1);
  let row;
  if (existing[0]) {
    [row] = await db
      .update(businessSettings)
      .set({ ...settingsInputToRow(parsed.data), updatedAt: new Date() })
      .where(eq(businessSettings.id, existing[0].id))
      .returning();
  } else {
    [row] = await db.insert(businessSettings).values(settingsInputToRow(parsed.data)).returning();
  }

  return NextResponse.json({ business: rowToBusiness(row) });
}
