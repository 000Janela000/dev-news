## ADDED Requirements

### Requirement: RSS adapter
The system SHALL provide a generic RSS adapter that fetches and parses any RSS 2.0 or Atom feed. It SHALL use `rss-parser` with manual `fetch()` + `AbortController` for timeout control (10-second timeout). It SHALL extract `content:encoded` for full content when available, falling back to `description`. Each RSS feed configured in the source registry SHALL be fetched and normalized into `TrackedItem[]`.

#### Scenario: Successful RSS feed fetch
- **WHEN** the RSS adapter fetches a valid feed URL
- **THEN** it SHALL return an array of TrackedItems with title, url, content, publishedAt, and the source's default category

#### Scenario: RSS feed timeout
- **WHEN** a feed URL does not respond within 10 seconds
- **THEN** the adapter SHALL abort the request, log the error, and return an empty array (not throw)

#### Scenario: Malformed RSS feed
- **WHEN** a feed returns invalid XML
- **THEN** the adapter SHALL catch the parse error, log it, and return an empty array

#### Scenario: Multiple RSS feeds
- **WHEN** the adapter processes all enabled RSS sources from the registry
- **THEN** it SHALL fetch each feed independently, returning combined results with per-feed error isolation

### Requirement: HackerNews adapter
The system SHALL provide a HackerNews adapter that fetches AI-related stories using the Algolia `search_by_date` API. It SHALL run multiple specific keyword queries: "LLM", "Claude", "GPT", "machine learning", "AI coding", "AI agent", "transformer model", "generative AI". It SHALL filter by `tags=story` and `numericFilters=points>5`. Results SHALL be deduplicated by story ID across queries.

#### Scenario: Fetch recent AI stories
- **WHEN** the HN adapter is called with a `since` date
- **THEN** it SHALL query the Algolia API with `numericFilters=created_at_i>{unixTimestamp}` and return stories as TrackedItems

#### Scenario: Cross-query deduplication
- **WHEN** the same story appears in results for both "LLM" and "Claude" queries
- **THEN** the adapter SHALL return it only once, deduplicated by `objectID`

#### Scenario: API failure
- **WHEN** the Algolia API returns an error or times out
- **THEN** the adapter SHALL log the error and return whatever results were collected from successful queries

### Requirement: GitHub adapter
The system SHALL provide a GitHub adapter that discovers trending AI repositories using the GitHub Search API (`/search/repositories`). It SHALL use authenticated requests (via `GITHUB_TOKEN` env var). Queries SHALL use `topic:` and `in:description` qualifiers with AI/ML keywords, filtered by `created:>{date}` and `stars:>10`, sorted by stars descending. A 2-second delay SHALL be added between search requests to respect secondary rate limits.

#### Scenario: Fetch trending AI repos
- **WHEN** the GitHub adapter is called with a `since` date
- **THEN** it SHALL return repositories as TrackedItems with the repo name as title, description as content, HTML URL as url, and star count in metadata

#### Scenario: Rate limit delay
- **WHEN** multiple search queries are executed
- **THEN** there SHALL be at least a 2-second delay between each API request

#### Scenario: Missing GITHUB_TOKEN
- **WHEN** the `GITHUB_TOKEN` environment variable is not set
- **THEN** the adapter SHALL log a warning and use unauthenticated requests (10 req/min limit) or return an empty array

### Requirement: ArXiv adapter
The system SHALL provide an ArXiv adapter that fetches recent papers from the ArXiv export API. It SHALL query categories `cs.AI`, `cs.CL`, and `cs.LG` sorted by submission date descending. The API returns Atom XML which SHALL be parsed using `rss-parser`. A 3-second delay SHALL be respected between sequential requests per ArXiv's requirements.

#### Scenario: Fetch recent AI papers
- **WHEN** the ArXiv adapter is called
- **THEN** it SHALL return papers as TrackedItems with the paper title, abstract as content, ArXiv URL, and category "research_papers"

#### Scenario: Parse Atom XML response
- **WHEN** the ArXiv API returns an Atom XML response
- **THEN** the adapter SHALL parse it successfully using rss-parser's Atom support

#### Scenario: Rate limit compliance
- **WHEN** the adapter needs to make sequential requests
- **THEN** it SHALL wait at least 3 seconds between requests

### Requirement: Unified source orchestrator
The system SHALL provide a `fetchAllSources()` function that runs all enabled source adapters concurrently using `Promise.allSettled`. It SHALL collect results from all fulfilled promises, log rejected ones, and return a combined `TrackedItem[]` with per-source fetch statistics (items found, duration, errors).

#### Scenario: All sources succeed
- **WHEN** all source adapters return successfully
- **THEN** `fetchAllSources()` SHALL return the combined array of all TrackedItems

#### Scenario: One source fails
- **WHEN** the ArXiv adapter throws an error but RSS and HN succeed
- **THEN** `fetchAllSources()` SHALL still return results from RSS and HN, and log the ArXiv failure

#### Scenario: Fetch statistics
- **WHEN** `fetchAllSources()` completes
- **THEN** it SHALL return metadata including: per-source item count, per-source duration in ms, total items, and any error messages
