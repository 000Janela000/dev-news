# AI Dev Tracker - Implementation Plan

> **Protocol**: Execute ONE phase at a time. After each phase: sync this plan, re-analyze all remaining phases, assess relevance, re-phase if needed. See CLAUDE.md "Phase Execution Protocol" for full rules.

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
- `[-]` Skipped / Removed (with reason)

---

## Phase 1: Core Types & Data Architecture `[x]`

**Goal**: Define the data model and source adapter interface that everything else builds on.

**Tasks**:
- [ ] Create `TrackedItem` type (id, title, summary, source, category, url, publishedAt, tags, importance)
- [ ] Create `DataSource` interface (name, fetch, normalize)
- [ ] Create category enum (Models, Tools, Practices, Industry, Research)
- [ ] Create source configuration schema (name, type, url, category mapping, enabled)
- [ ] Set up `src/lib/types/`, `src/lib/sources/`, `src/config/`
- [ ] Add source registry with initial list of 10+ sources (config only, no fetching yet)

**Deliverables**: Type system, interfaces, source config - the foundation contract.

**Exit Criteria**: Types compile, source config is valid, all future phases depend on these types.

---

## Phase 2: Data Pipeline - Source Adapters `[x]`

**Goal**: Build adapters that fetch and normalize data from real sources.

**Tasks**:
- [ ] RSS adapter (generic, works with any RSS/Atom feed)
- [ ] HackerNews API adapter (filter AI/ML stories, top stories endpoint)
- [ ] GitHub Trending adapter (scrape/API for AI-related repos)
- [ ] ArXiv API adapter (cs.AI, cs.CL categories)
- [ ] Adapter tests with sample data
- [ ] Unified fetch function that runs all enabled adapters

**Deliverables**: Working data fetching from 4 source types covering 10+ actual sources.

**Exit Criteria**: Can run a script that fetches real data from all sources and outputs normalized `TrackedItem[]`.

---

## Phase 3: Storage Layer (Supabase) `[x]`

**Goal**: Persist fetched data so the dashboard can read from a database instead of fetching live.

**Tasks**:
- [ ] Supabase project setup (free tier)
- [ ] Database schema: `items` table, `sources` table, `fetch_logs` table
- [ ] Supabase client setup (`src/lib/supabase.ts`)
- [ ] Insert/upsert logic (dedup by URL)
- [ ] Query helpers (by category, by date range, by source, search)
- [ ] Environment variables setup (.env.local, .env.example)

**Deliverables**: Working database layer with CRUD operations.

**Exit Criteria**: Can fetch → normalize → store → query the full pipeline locally.

---

## Phase 4: Dashboard UI - Main View `[ ]`

**Goal**: Build the primary dashboard that users see - the summary view.

**Tasks**:
- [ ] App layout (header, sidebar/nav, main content area)
- [ ] Dashboard page with category sections
- [ ] `TrackedItemCard` component (title, source badge, time ago, summary snippet, category tag)
- [ ] Category filter tabs/pills
- [ ] Time range selector (today, this week, this month)
- [ ] Source filter dropdown
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Responsive design (mobile-first)

**Deliverables**: Functional dashboard reading from Supabase, filterable by category/time/source.

**Exit Criteria**: Dashboard loads real data, filters work, looks clean on desktop and mobile.

---

## Phase 5: Detail View & Navigation `[ ]`

**Goal**: Build the drill-down view for individual items.

**Tasks**:
- [ ] Detail page (`/item/[id]`) with full content
- [ ] Back navigation
- [ ] Related items sidebar (same category, similar tags)
- [ ] External link to original source
- [ ] Share URL support
- [ ] Breadcrumb navigation

**Deliverables**: Complete drill-down experience from dashboard card to full detail.

**Exit Criteria**: Can click any card → see full details → navigate back smoothly.

---

## Phase 6: AI Summarization `[ ]`

**Goal**: Add LLM-powered summarization for fetched content.

**Tasks**:
- [ ] Gemini API integration (free tier, `src/lib/summarizer/`)
- [ ] Summarization prompt engineering (concise, dev-focused, extracting key takeaways)
- [ ] Rate limiting logic (15 RPM, batch processing)
- [ ] Summary caching (don't re-summarize existing items)
- [ ] Fallback: use first N sentences if API unavailable
- [ ] Importance scoring (1-5 based on content signals)

**Deliverables**: Automated summarization pipeline integrated with data fetching.

**Exit Criteria**: New items get AI-generated summaries, rate limits are respected, fallback works.

---

## Phase 7: GitHub Actions Automation `[ ]`

**Goal**: Automate the data pipeline to run on a schedule.

**Tasks**:
- [ ] GitHub Actions workflow: fetch → summarize → store (cron every 6 hours)
- [ ] Secrets management (Supabase keys, Gemini API key)
- [ ] Error handling and alerting (GitHub Actions annotations)
- [ ] Fetch log tracking (what was fetched, when, how many items)
- [ ] Manual trigger option (workflow_dispatch)
- [ ] Efficiency: skip sources that haven't updated

**Deliverables**: Fully automated pipeline running 4x daily.

**Exit Criteria**: Pipeline runs unattended, data stays fresh, stays within free tier limits.

---

## Phase 8: Enhanced Dashboard Features `[ ]`

**Goal**: Add the features that make this genuinely useful beyond basic aggregation.

**Tasks**:
- [ ] "What's New Today" hero section (top 5 most important items)
- [ ] Trend detection (items mentioned across multiple sources)
- [ ] Model comparison tracker (table of latest models with key metrics)
- [ ] Pricing changes tracker (notable cost changes in AI services)
- [ ] Search functionality (full-text search across items)
- [ ] "Weekly Digest" auto-generated summary

**Deliverables**: Dashboard that goes beyond aggregation into actual intelligence.

**Exit Criteria**: Dashboard provides genuine value above just reading individual sources.

---

## Phase 9: Polish & Deploy `[ ]`

**Goal**: Production-ready deployment with good UX.

**Tasks**:
- [ ] Vercel deployment setup
- [ ] Environment variables in Vercel dashboard
- [ ] SEO metadata (title, description, OG image)
- [ ] PWA support (installable, works offline with cached data)
- [ ] Performance audit (Core Web Vitals)
- [ ] Error boundaries and fallback UI
- [ ] Favicon and branding
- [ ] README with setup instructions

**Deliverables**: Live, deployed, fast, installable dashboard.

**Exit Criteria**: Site is live on Vercel, loads fast, looks professional.

---

## Plan Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-18 | Initial plan created | Project kickoff - 9 phases |
| 2026-03-19 | Phases 1-3 completed | Core types, 4 source adapters (RSS/HN/GitHub/ArXiv), Drizzle storage layer, dedup pipeline, pipeline script |
