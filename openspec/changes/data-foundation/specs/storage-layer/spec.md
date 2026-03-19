## ADDED Requirements

### Requirement: Database schema
The system SHALL define a Drizzle ORM schema with three tables: `items` (stores TrackedItems), `sources` (stores source configurations and metadata), and `fetch_logs` (stores pipeline run logs). The `items` table SHALL have a unique index on `url_normalized` for deduplication. All timestamp columns SHALL use `timestamptz` (with timezone).

#### Scenario: Items table schema
- **WHEN** the items table is created
- **THEN** it SHALL have columns: id (text PK), url (text not null), url_normalized (text unique not null), title (text not null), content (text nullable), summary (text nullable), source (text not null), source_type (text not null), category (text not null), importance (integer nullable), tags (text array), metadata (jsonb nullable), published_at (timestamptz not null), fetched_at (timestamptz not null default now), summarized_at (timestamptz nullable)

#### Scenario: Fetch logs table schema
- **WHEN** the fetch_logs table is created
- **THEN** it SHALL have columns: id (text PK), source (text not null), fetched_at (timestamptz not null default now), item_count (integer not null), duration_ms (integer nullable), error (text nullable), pipeline_run_id (text not null)

### Requirement: Supabase client with Drizzle
The system SHALL configure Drizzle ORM with the `postgres` driver connecting to Supabase PostgreSQL. The connection SHALL use `prepare: false` for compatibility with Supabase's connection pooler (Transaction mode). Connection URL SHALL be read from `DATABASE_URL` environment variable.

#### Scenario: Successful connection
- **WHEN** the database client is initialized with a valid `DATABASE_URL`
- **THEN** it SHALL establish a connection and execute queries without "prepared statement does not exist" errors

#### Scenario: Missing DATABASE_URL
- **WHEN** `DATABASE_URL` is not set
- **THEN** the module SHALL throw a descriptive error at import time

### Requirement: URL deduplication
The system SHALL normalize URLs before storage using `normalize-url` with options: strip www, strip hash, remove UTM/tracking parameters (utm_*, ref, source, fbclid, gclid, mc_cid, mc_eid), remove trailing slash, sort query parameters. The normalized URL SHALL be stored in `url_normalized` and used as the dedup key.

#### Scenario: URLs with tracking parameters are normalized
- **WHEN** two items have URLs `https://openai.com/blog/post?utm_source=twitter` and `https://openai.com/blog/post?utm_medium=email`
- **THEN** both SHALL normalize to the same `url_normalized` value and be treated as duplicates

#### Scenario: Different URLs are preserved
- **WHEN** two items have genuinely different URLs
- **THEN** they SHALL have different `url_normalized` values and both be stored

### Requirement: Title similarity deduplication
The system SHALL perform secondary deduplication using Jaccard similarity on tokenized titles. If two items have different normalized URLs but a title similarity score > 0.6, the system SHALL flag or merge them as duplicates, keeping the item with more content.

#### Scenario: Similar titles from different sources
- **WHEN** item A has title "OpenAI Releases GPT-5 Model" and item B has title "GPT-5 Released by OpenAI"
- **THEN** the Jaccard similarity SHALL exceed 0.6 and they SHALL be treated as duplicates

#### Scenario: Different titles are preserved
- **WHEN** two items have titles with Jaccard similarity < 0.6
- **THEN** both SHALL be stored as separate items

### Requirement: Idempotent upsert
The system SHALL upsert items using `ON CONFLICT (url_normalized) DO UPDATE`. On conflict, it SHALL update `content` only if the new content is longer (more complete), preserve existing `summary` (never overwrite), and update `fetched_at` to current timestamp. The upsert SHALL handle batch inserts efficiently.

#### Scenario: New item inserted
- **WHEN** an item with a new url_normalized is upserted
- **THEN** it SHALL be inserted as a new row

#### Scenario: Duplicate item updates content
- **WHEN** an item with an existing url_normalized is upserted with longer content
- **THEN** the content SHALL be updated but summary SHALL be preserved

#### Scenario: Duplicate item preserves summary
- **WHEN** an item with an existing url_normalized and existing summary is upserted
- **THEN** the existing summary SHALL NOT be overwritten

### Requirement: Query helpers
The system SHALL provide query helper functions: `getItemsByCategory(category, limit, offset)`, `getItemsByDateRange(start, end)`, `getItemsBySource(source)`, `searchItems(query)` (ILIKE on title and content), `getUnsummarizedItems(limit)` (items where summary is null, ordered by publishedAt desc), and `getRecentItems(limit)` (most recent items across all categories).

#### Scenario: Filter by category
- **WHEN** `getItemsByCategory("models_releases", 20, 0)` is called
- **THEN** it SHALL return up to 20 items with category "models_releases", ordered by publishedAt descending

#### Scenario: Get unsummarized items
- **WHEN** `getUnsummarizedItems(50)` is called
- **THEN** it SHALL return up to 50 items where summary is null, ordered by publishedAt descending

#### Scenario: Search items
- **WHEN** `searchItems("GPT-5")` is called
- **THEN** it SHALL return items where title or content contains "GPT-5" (case-insensitive)

### Requirement: Environment configuration
The system SHALL provide `.env.example` documenting all required and optional environment variables: `DATABASE_URL` (required), `SUPABASE_URL` (required), `SUPABASE_ANON_KEY` (required for frontend), `SUPABASE_SERVICE_KEY` (required for pipeline), `GITHUB_TOKEN` (optional, for GitHub adapter), `GEMINI_API_KEY` (optional, for future summarization).

#### Scenario: Environment example file
- **WHEN** a developer clones the repository
- **THEN** `.env.example` SHALL list all environment variables with descriptions and placeholder values
