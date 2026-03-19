import { sql, desc, and, eq, gte, lte, or, ilike } from "drizzle-orm";
import { getDb } from "./client";
import { items } from "./schema";
import type { Category } from "@/lib/types";

export async function getItemsByCategory(
  category: Category,
  limit = 20,
  offset = 0
) {
  const db = getDb();
  return db
    .select()
    .from(items)
    .where(eq(items.category, category))
    .orderBy(desc(items.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getItemsByDateRange(start: Date, end: Date) {
  const db = getDb();
  return db
    .select()
    .from(items)
    .where(and(gte(items.publishedAt, start), lte(items.publishedAt, end)))
    .orderBy(desc(items.publishedAt));
}

export async function getItemsBySource(source: string, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(items)
    .where(eq(items.source, source))
    .orderBy(desc(items.publishedAt))
    .limit(limit);
}

export async function searchItems(query: string, limit = 50) {
  const db = getDb();
  const pattern = `%${query}%`;
  return db
    .select()
    .from(items)
    .where(or(ilike(items.title, pattern), ilike(items.content, pattern)))
    .orderBy(desc(items.publishedAt))
    .limit(limit);
}

export async function getUnsummarizedItems(limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(items)
    .where(sql`${items.summary} IS NULL`)
    .orderBy(desc(items.publishedAt))
    .limit(limit);
}

export async function getRecentItems(limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(items)
    .orderBy(desc(items.publishedAt))
    .limit(limit);
}

export async function getItemById(id: string) {
  const db = getDb();
  const result = await db
    .select()
    .from(items)
    .where(eq(items.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getItemCounts() {
  const db = getDb();
  const result = await db
    .select({
      category: items.category,
      count: sql<number>`count(*)::int`,
    })
    .from(items)
    .groupBy(items.category);
  return result;
}
