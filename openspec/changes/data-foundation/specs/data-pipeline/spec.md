## ADDED Requirements

### Requirement: Pipeline script
The system SHALL provide a pipeline script at `scripts/pipeline.ts` that orchestrates the full fetch → dedup → store flow. It SHALL be runnable via `npx tsx scripts/pipeline.ts`. The script SHALL: (1) determine the `since` date from the most recent fetch log or default to 24 hours ago, (2) call `fetchAllSources(since)`, (3) deduplicate results, (4) upsert to database, (5) log fetch statistics to `fetch_logs` table.

#### Scenario: First run (no previous fetch logs)
- **WHEN** the pipeline runs with no existing fetch logs
- **THEN** it SHALL fetch items from the last 24 hours

#### Scenario: Subsequent run
- **WHEN** the pipeline runs after a previous successful run
- **THEN** it SHALL fetch items newer than the last successful fetch timestamp

#### Scenario: Full pipeline execution
- **WHEN** the pipeline script is executed
- **THEN** it SHALL fetch from all enabled sources, deduplicate, upsert to database, and log results — all within a single invocation

### Requirement: Pipeline logging
The system SHALL log structured output during pipeline execution including: pipeline run ID, start/end timestamps, per-source statistics (items fetched, duration, errors), deduplication stats (total before, duplicates removed, total after), and database stats (new items inserted, existing items updated).

#### Scenario: Successful run logging
- **WHEN** the pipeline completes successfully
- **THEN** it SHALL log a summary with total items fetched, duplicates removed, items stored, and total duration

#### Scenario: Partial failure logging
- **WHEN** some sources fail but others succeed
- **THEN** it SHALL log which sources failed with error messages AND still proceed with successful source data

### Requirement: Pipeline idempotency
The pipeline SHALL be safe to run multiple times without creating duplicate data. Running the pipeline twice in quick succession SHALL produce the same database state as running it once.

#### Scenario: Double run produces no duplicates
- **WHEN** the pipeline is run twice within the same time window
- **THEN** the second run SHALL upsert existing items (updating fetched_at) without creating duplicate rows

### Requirement: Pipeline error resilience
The pipeline SHALL NOT exit with a non-zero code if individual sources fail. It SHALL only exit with an error code if the database connection fails or if ALL sources fail. Partial results SHALL always be persisted.

#### Scenario: Database connection failure
- **WHEN** the database is unreachable
- **THEN** the pipeline SHALL exit with code 1 and log the connection error

#### Scenario: All sources fail
- **WHEN** every source adapter returns an error
- **THEN** the pipeline SHALL exit with code 1 and log all error messages

#### Scenario: Some sources fail
- **WHEN** 2 out of 4 source types fail
- **THEN** the pipeline SHALL persist results from the 2 successful sources and exit with code 0
