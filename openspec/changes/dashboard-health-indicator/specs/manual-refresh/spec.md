## ADDED Requirements

### Requirement: Refresh API endpoint
The system SHALL expose a POST `/api/refresh` endpoint that triggers the light pipeline via GitHub Actions workflow_dispatch.

#### Scenario: Successful trigger
- **WHEN** a POST request is made and the last fetch was more than 30 minutes ago
- **THEN** the endpoint triggers the `pipeline-light.yml` workflow and returns `{ triggered: true }`

#### Scenario: Cooldown active
- **WHEN** a POST request is made and the last fetch was less than 30 minutes ago
- **THEN** the endpoint returns HTTP 429 with `{ triggered: false, reason: "cooldown", retryAfterMs: <number> }`

#### Scenario: GitHub token not configured
- **WHEN** a POST request is made and `GH_PAT` is not set
- **THEN** the endpoint returns HTTP 503 with `{ triggered: false, reason: "not_configured" }`

### Requirement: Manual refresh button
The dashboard SHALL display a refresh button that allows users to trigger the light pipeline.

#### Scenario: Button visible when stale
- **WHEN** the health status is "degraded" or "stale"
- **THEN** a refresh button is visible and clickable

#### Scenario: Button hidden when healthy
- **WHEN** the health status is "healthy"
- **THEN** the refresh button is hidden or disabled

#### Scenario: Button pressed
- **WHEN** the user clicks the refresh button
- **THEN** the button enters a "Refreshing..." state with a loading indicator and becomes non-clickable

### Requirement: Refresh state machine
The refresh button SHALL follow a state machine: idle → refreshing → fresh.

#### Scenario: Polling during refresh
- **WHEN** the button is in "refreshing" state
- **THEN** the client polls `/api/health` every 30 seconds

#### Scenario: Refresh completes
- **WHEN** the health API returns a `lastFetch` timestamp newer than when the button was pressed
- **THEN** the button transitions to "fresh" state (disabled), the health indicator updates to green

#### Scenario: Page load with fresh data
- **WHEN** the page loads and health status is "healthy"
- **THEN** the button starts in "fresh" state (hidden/disabled)
