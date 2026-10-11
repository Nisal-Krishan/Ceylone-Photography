import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, items } from "@/db/schema";
import { SEED_ITEMS } from "@/db/seed-data";

const SEED_FLAG = "items_seeded_v1";
let seedPromise: Promise<void> | null = null;

/**
 * Loads the initial catalogue exactly once (only when the items table is empty
 * on the very first run). Safe to call on every request — it is memoised per process.
 */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const [flag] = await db
    .select({ key: appSettings.key })
    .from(appSettings)
    .where(eq(appSettings.key, SEED_FLAG))
    .limit(1);
  if (flag) return;

  await db.transaction(async (tx) => {
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(items);
    if (Number(count) === 0) {
      await tx.insert(items).values(
        SEED_ITEMS.map((i) => ({
          name: i.name,
          description: i.description ?? "",
          category: i.category,
          defaultRate: String(i.rate),
        })),
      );
    }
    await tx
      .insert(appSettings)
      .values({ key: SEED_FLAG, value: "done" })
      .onConflictDoNothing();
  });
}
