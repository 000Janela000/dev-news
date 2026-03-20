## ADDED Requirements

### Requirement: Health API endpoint
The system SHALL expose a GET `/api/health` endpoint that returns the last successful fetch timestamp and a computed health status.

#### Scenario: Data is fresh
- **WHEN** the last successful fetch was less than 4 hours ago
- **THEN** the endpoint returns `{ status: "healthy", lastFetch: "<ISO timestamp>", agoMs: <number> }`

#### Scenario: Data is aging
- **WHEN** the last successful fetch was between 4 and 12 hours ago
- **THEN** the endpoint returns `{ status: "degraded", lastFetch: "<ISO timestamp>", agoMs: <number> }`

#### Scenario: Data is stale
- **WHEN** the last successful fetch was more than 12 hours ago
- **THEN** the endpoint returns `{ status: "stale", lastFetch: "<ISO timestamp>", agoMs: <number> }`

#### Scenario: No fetch history
- **WHEN** the fetch_logs table has no successful entries
- **THEN** the endpoint returns `{ status: "stale", lastFetch: null, agoMs: null }`

### Requirement: Health indicator in dashboard header
The dashboard header SHALL display a health indicator showing the current pipeline status. The indicator SHALL be visible on all pages that include the header.

#### Scenario: Healthy status display
- **WHEN** the health API returns status "healthy"
- **THEN** the header shows a green dot and "Updated X ago" text

#### Scenario: Degraded status display
- **WHEN** the health API returns status "degraded"
- **THEN** the header shows a yellow dot and "Updated X ago" text

#### Scenario: Stale status display
- **WHEN** the health API returns status "stale"
- **THEN** the header shows a red dot and "Updated X ago" text

### Requirement: Stale data warning banner
The dashboard SHALL display a non-dismissible warning banner when data is stale.

#### Scenario: Banner appears when stale
- **WHEN** the health status is "stale"
- **THEN** a warning banner appears below the header stating data hasn't been updated and suggesting a manual refresh

#### Scenario: Banner hidden when healthy
- **WHEN** the health status is "healthy" or "degraded"
- **THEN** no warning banner is displayed
