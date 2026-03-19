## Why

Software developers need a single place to track AI developments that affect their work, but every existing solution is an email newsletter with no interactivity, filtering, or drill-down. 84% of developers use AI tools daily yet 65% worry about falling behind. The data foundation — types, source adapters, storage, and pipeline — must exist before any UI or summarization can be built. This is Phase 1-3 of the project: the backbone that everything else depends on.

## What Changes

- Define the complete type system: `TrackedItem` schema (Zod-first), `DataSource` interface, category enum, source configuration registry
- Build 4 source adapters: RSS (generic, 8+ feeds), HackerNews (Algolia API), GitHub (Search API for trending AI repos), ArXiv (cs.AI/cs.CL/cs.LG papers)
- Create the storage layer: Drizzle ORM schema for Supabase PostgreSQL, upsert with URL-based deduplication, query helpers for category/date/source filtering
- Build a pipeline script (`scripts/pipeline.ts`) that ties fetch → dedup → store into a single runnable command
- Install required dependencies: `@google/genai`, `normalize-url`, `postgres`, `tsx`, `zod-to-json-schema`

## Capabilities

### New Capabilities
- `data-schema`: Core type system — TrackedItem Zod schema, DataSource interface, category enum, source config types. Single source of truth for all data shapes.
- `source-adapters`: Four source adapters (RSS, HackerNews, GitHub, ArXiv) implementing the DataSource interface, plus a unified fetchAllSources orchestrator.
- `storage-layer`: Drizzle ORM schema, Supabase client, URL deduplication, upsert logic, and query helpers for filtering/searching items.
- `data-pipeline`: Pipeline script that orchestrates fetch → dedup → store, runnable locally via `npx tsx scripts/pipeline.ts` with structured logging.

### Modified Capabilities
<!-- None — this is the first implementation, no existing specs to modify. -->

## Impact

- **New files**: ~15 files across `src/lib/types/`, `src/lib/sources/`, `src/lib/db/`, `src/config/`, `scripts/`
- **Dependencies**: Adding `@google/genai`, `normalize-url`, `postgres`, `tsx`, `zod-to-json-schema` (some dev-only)
- **Environment**: Requires `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GITHUB_TOKEN` env vars (optional `GEMINI_API_KEY` for future use)
- **Database**: Creates `items`, `sources`, `fetch_logs` tables in Supabase PostgreSQL
- **External APIs**: HackerNews Algolia (no auth), GitHub Search (auth token), ArXiv export (no auth), various RSS feeds (no auth)
