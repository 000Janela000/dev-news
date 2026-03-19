## 1. Dependencies & Environment Setup

- [ ] 1.1 Install required packages: `postgres`, `normalize-url`, `@google/genai`, and dev deps `tsx`, `zod-to-json-schema`
- [ ] 1.2 Create `.env.example` with all required/optional env vars (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, GITHUB_TOKEN, GEMINI_API_KEY)
- [ ] 1.3 Create `drizzle.config.ts` for Drizzle Kit (pointing to Supabase)

## 2. Core Types & Data Schema

- [ ] 2.1 Create `src/lib/types/schema.ts` with TrackedItem Zod schema, NewTrackedItem schema, Category enum, SourceType enum — all types derived via `z.infer<>`
- [ ] 2.2 Create `src/lib/types/source.ts` with DataSource interface and SourceConfig type
- [ ] 2.3 Create `src/lib/types/index.ts` barrel export

## 3. Source Configuration

- [ ] 3.1 Create `src/config/sources.ts` with source registry containing 12+ sources (8 RSS feeds, HN, GitHub, ArXiv cs.AI, ArXiv cs.CL) with id, name, type, url, enabled, defaultCategory

## 4. Source Adapters

- [ ] 4.1 Create `src/lib/sources/rss.ts` — generic RSS adapter using rss-parser with fetch+AbortController timeout, content:encoded extraction, per-feed error isolation
- [ ] 4.2 Create `src/lib/sources/hackernews.ts` — HN Algolia adapter with multi-query strategy, story dedup by objectID, points>5 filter
- [ ] 4.3 Create `src/lib/sources/github.ts` — GitHub Search API adapter with topic/description queries, 2s rate delay, star count in metadata
- [ ] 4.4 Create `src/lib/sources/arxiv.ts` — ArXiv export API adapter, Atom XML parsing via rss-parser, 3s rate delay, cs.AI/cs.CL/cs.LG categories
- [ ] 4.5 Create `src/lib/sources/index.ts` — fetchAllSources() orchestrator using Promise.allSettled with per-source stats

## 5. Storage Layer

- [ ] 5.1 Create `src/lib/db/schema.ts` — Drizzle schema for items, sources, fetch_logs tables with proper types and indexes
- [ ] 5.2 Create `src/lib/db/client.ts` — Drizzle client with postgres driver, prepare:false for Supabase pooler
- [ ] 5.3 Create `src/lib/db/dedup.ts` — URL normalization (normalize-url) and Jaccard title similarity functions
- [ ] 5.4 Create `src/lib/db/mutations.ts` — upsertItems() with onConflictDoUpdate, dedup pipeline, logFetchRun()
- [ ] 5.5 Create `src/lib/db/queries.ts` — getItemsByCategory, getItemsByDateRange, getItemsBySource, searchItems, getUnsummarizedItems, getRecentItems
- [ ] 5.6 Create `src/lib/db/index.ts` barrel export

## 6. Pipeline Script

- [ ] 6.1 Create `scripts/pipeline.ts` — main pipeline: determine since date → fetchAllSources → dedup → upsert → log results
- [ ] 6.2 Add structured logging: pipeline run ID, per-source stats, dedup stats, timing
- [ ] 6.3 Add error handling: exit code 0 on partial success, exit code 1 only on total failure or DB connection error

## 7. Database Migration

- [ ] 7.1 Generate Drizzle migration for initial schema (`npx drizzle-kit generate`)
- [ ] 7.2 Add migration push script to package.json (`db:push`, `db:generate`, `db:studio`)
