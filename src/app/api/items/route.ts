import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { parseItemBody, serializeItem } from "@/lib/api";

export const dynamic = "force-dynamic";

/** List all rental items (grouped by category, then name). */
export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(items).orderBy(asc(items.category), asc(items.name));
  return NextResponse.json({ items: rows.map(serializeItem) });
}

/** Create a new rental item. */
export async function POST(req: Request) {
  const parsed = parseItemBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [row] = await db
    .insert(items)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      defaultRate: String(parsed.data.defaultRate),
    })
    .returning();

  return NextResponse.json({ item: serializeItem(row) }, { status: 201 });
}
