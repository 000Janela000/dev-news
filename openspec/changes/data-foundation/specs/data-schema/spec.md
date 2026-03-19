## ADDED Requirements

### Requirement: TrackedItem schema
The system SHALL define a `TrackedItem` Zod schema as the single source of truth for all tracked AI development items. The schema SHALL include: `id` (string, nanoid), `url` (string, valid URL), `urlNormalized` (string, normalized URL for dedup), `title` (string, non-empty), `content` (string, optional raw content/excerpt), `summary` (string, optional AI-generated summary), `source` (string, source identifier e.g. "hackernews", "rss:openai"), `sourceType` (enum: "rss", "hackernews", "github", "arxiv"), `category` (Category enum value), `importance` (number 1-5, optional), `tags` (string array), `metadata` (record of source-specific data), `publishedAt` (Date), `fetchedAt` (Date), `summarizedAt` (Date, optional). TypeScript types SHALL be derived via `z.infer<>`.

#### Scenario: Valid item passes validation
- **WHEN** a source adapter returns an item with all required fields populated
- **THEN** the item SHALL pass `TrackedItemSchema.parse()` without errors

#### Scenario: Item missing required field is rejected
- **WHEN** a source adapter returns an item without a `title` or `url`
- **THEN** `TrackedItemSchema.parse()` SHALL throw a ZodError with a descriptive message

#### Scenario: TypeScript type is derived from schema
- **WHEN** code imports `TrackedItem` type
- **THEN** it SHALL be defined as `z.infer<typeof TrackedItemSchema>` with no manual interface duplication

### Requirement: Category enum
The system SHALL define a `Category` enum with exactly 5 values: `models_releases`, `tools_frameworks`, `practices_approaches`, `industry_trends`, `research_papers`. The enum SHALL be defined as a Zod enum and used consistently across all layers.

#### Scenario: Category values are exhaustive
- **WHEN** the Category enum is referenced
- **THEN** it SHALL contain exactly: "models_releases", "tools_frameworks", "practices_approaches", "industry_trends", "research_papers"

#### Scenario: Invalid category is rejected
- **WHEN** an item has a category value not in the enum (e.g., "random")
- **THEN** Zod validation SHALL reject it

### Requirement: DataSource interface
The system SHALL define a `DataSource` interface that all source adapters MUST implement. The interface SHALL include: `name` (string identifier), `type` (source type enum value), `fetch(since: Date): Promise<TrackedItem[]>` (fetches items newer than `since`), and `isEnabled(): boolean`.

#### Scenario: Adapter implements DataSource
- **WHEN** a new source adapter is created
- **THEN** it MUST implement all methods of the `DataSource` interface

#### Scenario: Fetch returns normalized items
- **WHEN** `adapter.fetch(since)` is called
- **THEN** it SHALL return an array of items conforming to the `TrackedItem` schema

### Requirement: Source configuration registry
The system SHALL define a source configuration that lists all enabled data sources with their URLs, types, and default category mappings. The registry SHALL include at minimum 12 sources: 8 RSS feeds (Anthropic, OpenAI, Google AI, Meta AI, HuggingFace, The Decoder, MarkTechPost, VentureBeat AI), HackerNews, GitHub trending, ArXiv cs.AI, and ArXiv cs.CL. Each source entry SHALL have: `id`, `name`, `type`, `url` (if applicable), `enabled` (boolean), `defaultCategory`.

#### Scenario: Source registry contains 12+ sources
- **WHEN** the source registry is loaded
- **THEN** it SHALL contain at least 12 configured source entries

#### Scenario: Source can be disabled
- **WHEN** a source entry has `enabled: false`
- **THEN** the pipeline SHALL skip that source during fetching

### Requirement: NewTrackedItem schema for inserts
The system SHALL define a `NewTrackedItem` schema that omits auto-generated fields (`fetchedAt`, `summarizedAt`) from `TrackedItem`, used when source adapters produce items before database insertion.

#### Scenario: Adapter produces NewTrackedItem
- **WHEN** a source adapter normalizes raw data
- **THEN** it SHALL produce objects conforming to `NewTrackedItemSchema` (without fetchedAt/summarizedAt)
