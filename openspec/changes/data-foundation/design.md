## Context

The AI Dev Tracker is a greenfield Next.js 15 project with only scaffolding in place (default page, shadcn/ui button, Tailwind config). The data foundation must be built from scratch to support the full product vision: a real-time, filterable dashboard that aggregates AI developments from 10+ sources and presents AI-generated summaries.

The project operates entirely on free tiers: Supabase PostgreSQL (500MB), Gemini Flash-Lite (1000 RPD), GitHub Actions (2000 min/month), Vercel (10s function timeout). Every architectural decision must respect these constraints.

Dependencies already installed: `drizzle-orm`, `rss-parser`, `zod`, `date-fns`, `@supabase/supabase-js`, `lucide-react`. Need to add: `postgres`, `normalize-url`, `@google/genai`, `tsx`, `zod-to-json-schema`.

## Goals / Non-Goals

**Goals:**
- Define a type system (Zod-first) that all layers share — adapters, storage, API routes, and future UI
- Build adapters for 4 source types covering 12+ actual data sources
- Create an idempotent storage layer with URL-based deduplication
- Produce a runnable pipeline script: `npx tsx scripts/pipeline.ts`
- Keep the architecture extensible for future summarization (Phase 6) and GitHub Actions automation (Phase 7)

**Non-Goals:**
- AI summarization (Phase 6 — install SDK now, implement later)
- Dashboard UI (Phase 4)
- GitHub Actions workflow (Phase 7 — pipeline script must work standalone first)
- User authentication or personalization
- Full-text search indexing (query helpers use basic SQL ILIKE for now)

## Decisions

### 1. Zod as single source of truth for types
**Decision:** Define all data shapes as Zod schemas, derive TypeScript types with `z.infer<>`.
**Why over raw TypeScript interfaces:** Zod provides runtime validation at system boundaries (API responses, database reads) while also generating compile-time types. Source adapters return unvalidated external data — Zod catches malformed items before they enter the database.
**Alternative considered:** Plain TypeScript interfaces + manual validation. Rejected because it duplicates the type definition and validation logic diverges over time.

### 2. rss-parser with fetch + AbortController wrapper
**Decision:** Use `rss-parser` (already installed) but fetch XML manually with `fetch()` + `AbortController` for timeout, then parse with `parser.parseString()`.
**Why:** rss-parser's built-in `parseURL()` timeout is unreliable (GitHub issue #122). Manual fetch gives us control over timeout, headers, and error handling. Also works within Vercel's 10s function timeout constraint.
**Alternative considered:** `feedsmith` (newer, better malformed feed handling). Kept rss-parser since it's already installed and handles our known source feeds well.

### 3. HackerNews Algolia search_by_date with multiple specific queries
**Decision:** Run 8-10 specific keyword queries ("LLM", "Claude", "GPT-4", "AI coding", etc.) against `hn.algolia.com/api/v1/search_by_date` rather than one broad "AI" query.
**Why:** Broad "AI" query returns excessive noise. Specific queries yield higher signal-to-noise. Dedup across query results via URL normalization. Filter `tags=story` and `points>5` to remove comments and low-quality posts.
**Alternative considered:** HN Firebase API (official). Rejected because it only provides item IDs — would require N+1 requests to get story details. Algolia returns full objects in one call.

### 4. GitHub Search API over scraping /trending
**Decision:** Use authenticated GitHub Search API (`/search/repositories`) with `topic:`, `created:>`, and `stars:>` qualifiers.
**Why:** No official trending API exists. Search API with star-count sorting approximates trending. Authentication gives 5000 req/hr (30 search req/min). Scraping /trending is fragile and violates ToS.
**Alternative considered:** OSS Insight API (dedicated trending endpoint). Kept as fallback but GitHub Search is more flexible and well-documented.

### 5. Drizzle ORM with postgres driver (not Supabase JS client for data layer)
**Decision:** Use Drizzle ORM with the `postgres` driver for all data operations. Reserve `@supabase/supabase-js` for auth/realtime if needed later.
**Why:** Drizzle provides type-safe queries, migrations, and SQL-like syntax that AI can generate predictably. The Supabase JS client's query builder is less expressive for complex upserts and joins.
**Alternative considered:** Using `@supabase/supabase-js` directly. Rejected for data layer because Drizzle's `onConflictDoUpdate` is more ergonomic than Supabase's upsert, and Drizzle gives us migration tooling.

### 6. Three-layer deduplication: URL → Title → (future) Content
**Decision:** Primary dedup on normalized URL (using `normalize-url`). Secondary dedup on title Jaccard similarity (>0.6 threshold) for cross-source duplicates. Content fingerprinting (SimHash) deferred.
**Why:** URL normalization catches 90%+ of duplicates (same article linked from different referrers). Title similarity catches the same story published by multiple outlets. SimHash adds complexity for a marginal gain at our scale (<200 items/day).

### 7. Parallel source fetching with Promise.allSettled
**Decision:** Fetch all sources concurrently using `Promise.allSettled`, not `Promise.all`.
**Why:** `allSettled` ensures one failing source (e.g., ArXiv timeout) doesn't block the entire pipeline. Each result is either fulfilled or rejected, and we log both. Critical for reliability in a cron job that runs unattended.

## Risks / Trade-offs

- **[RSS feed format changes]** → Mitigation: Wrap each feed parse in try/catch, log failures, continue with other sources. The pipeline is resilient by design (allSettled).
- **[GitHub Search API secondary rate limit]** → Mitigation: 2-second delay between search requests. Limit to 5 queries per run.
- **[ArXiv API returns Atom XML, not JSON]** → Mitigation: rss-parser handles Atom format natively. Fall back to `fast-xml-parser` if edge cases emerge.
- **[Supabase free tier pauses after 1 week inactivity]** → Mitigation: 6-hour cron naturally keeps it active. Add a health-check query in the pipeline script.
- **[normalize-url is ESM-only]** → Mitigation: Project already uses Next.js 15 with ESM support. If import issues arise, inline a minimal URL normalization function.
- **[500MB Supabase storage limit]** → Mitigation: Design schema to be compact (text fields, no blobs). 500MB supports ~500K+ rows. Add 90-day pruning in pipeline script.
