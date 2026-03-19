import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const items = pgTable(
  "items",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    urlNormalized: text("url_normalized").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    summary: text("summary"),
    source: text("source").notNull(),
    sourceType: text("source_type").notNull(),
    category: text("category").notNull(),
    importance: integer("importance"),
    tags: text("tags").array(),
    metadata: jsonb("metadata"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    summarizedAt: timestamp("summarized_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("items_url_normalized_idx").on(table.urlNormalized)]
);

export const fetchLogs = pgTable("fetch_logs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  itemCount: integer("item_count").notNull(),
  durationMs: integer("duration_ms"),
  error: text("error"),
  pipelineRunId: text("pipeline_run_id").notNull(),
});

export type ItemRow = typeof items.$inferSelect;
export type NewItemRow = typeof items.$inferInsert;
export type FetchLogRow = typeof fetchLogs.$inferSelect;
