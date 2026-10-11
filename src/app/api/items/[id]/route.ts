import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { parseItemBody, serializeItem } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Update an existing item's name, description, category or default rate. */
export async function PUT(req: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid item id" }, { status: 400 });

  const parsed = parseItemBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const [row] = await db
    .update(items)
    .set({
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      defaultRate: String(parsed.data.defaultRate),
      updatedAt: new Date(),
    })
    .where(eq(items.id, id))
    .returning();

  if (!row) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ item: serializeItem(row) });
}

/**
 * Permanently remove an item from the catalogue.
 * Past bills keep their own snapshot of the item (item_id is set to null).
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid item id" }, { status: 400 });

  const deleted = await db.delete(items).where(eq(items.id, id)).returning({ id: items.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
