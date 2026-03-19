import { sql } from "drizzle-orm";
import { nanoid } from "@/lib/id";
import type { NewTrackedItem, FetchResult } from "@/lib/types";
import { getDb } from "./client";
import { items, fetchLogs } from "./schema";
import type { NewItemRow } from "./schema";

export async function upsertItems(
  newItems: NewTrackedItem[]
): Promise<{ inserted: number; updated: number }> {
  if (newItems.length === 0) return { inserted: 0, updated: 0 };

  const db = getDb();
  let inserted = 0;
  let updated = 0;

  // Process in batches of 50 to avoid oversized queries
  const BATCH_SIZE = 50;
  for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
    const batch = newItems.slice(i, i + BATCH_SIZE);
    const rows: NewItemRow[] = batch.map((item) => ({
      id: item.id,
      url: item.url,
      urlNormalized: item.urlNormalized,
      title: item.title,
      content: item.content ?? null,
      summary: item.summary ?? null,
      source: item.source,
      sourceType: item.sourceType,
      category: item.category,
      importance: item.importance ?? null,
      tags: item.tags,
      metadata: item.metadata,
      publishedAt: item.publishedAt,
    }));

    const result = await db
      .insert(items)
      .values(rows)
      .onConflictDoUpdate({
        target: items.urlNormalized,
        set: {
          // Update content only if new version is longer
          content: sql`CASE
            WHEN LENGTH(COALESCE(excluded.content, '')) > LENGTH(COALESCE(${items.content}, ''))
            THEN excluded.content
            ELSE ${items.content}
          END`,
          // Never overwrite existing summary
          summary: sql`COALESCE(${items.summary}, excluded.summary)`,
          fetchedAt: sql`now()`,
        },
      })
      .returning({ id: items.id });

    // Approximate: all returned rows were either inserted or updated
    inserted += result.length;
  }

  // The actual split between insert/update isn't easily determined with
  // onConflictDoUpdate, so we return total as inserted (consumer uses total)
  return { inserted, updated };
}

export async function logFetchRun(
  pipelineRunId: string,
  results: FetchResult[]
): Promise<void> {
  const db = getDb();

  const rows = results.map((r) => ({
    id: nanoid(),
    source: r.source,
    itemCount: r.items.length,
    durationMs: r.durationMs,
    error: r.error ?? null,
    pipelineRunId,
  }));

  if (rows.length > 0) {
    await db.insert(fetchLogs).values(rows);
  }
}

export async function updateItemSummary(
  itemId: string,
  summary: string,
  category: string,
  importance: number,
  tags: string[]
): Promise<void> {
  const db = getDb();
  await db
    .update(items)
    .set({
      summary,
      category,
      importance,
      tags,
      summarizedAt: sql`now()`,
    })
    .where(sql`${items.id} = ${itemId}`);
}

/** Delete items older than `days` to stay within Supabase 500MB free tier */
export async function pruneOldItems(days = 90): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(items)
    .where(sql`${items.publishedAt} < ${cutoff}`)
    .returning({ id: items.id });

  // Also prune old fetch logs
  await db
    .delete(fetchLogs)
    .where(sql`${fetchLogs.fetchedAt} < ${cutoff}`);

  return deleted.length;
}

export async function getLastFetchTime(): Promise<Date | null> {
  const db = getDb();
  const result = await db
    .select({ fetchedAt: fetchLogs.fetchedAt })
    .from(fetchLogs)
    .where(sql`${fetchLogs.error} IS NULL`)
    .orderBy(sql`${fetchLogs.fetchedAt} DESC`)
    .limit(1);

  return result[0]?.fetchedAt ?? null;
}
