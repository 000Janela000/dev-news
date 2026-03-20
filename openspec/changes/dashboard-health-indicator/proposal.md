## Why

DevNews has zero visibility into pipeline health. If the data pipeline fails silently at 2 AM, no one knows until they manually notice stale content. For a news dashboard, freshness IS the product — stale data destroys user trust. Users need to see at a glance whether their data is current, and have a way to trigger a refresh when it's not.

## What Changes

- Add a health status indicator (green/yellow/red dot) to the dashboard header showing pipeline freshness
- Display "Updated X ago" timestamp always visible next to the indicator
- Show a warning banner when data is stale (12+ hours)
- Add a manual refresh button that triggers the light pipeline via GitHub Actions workflow_dispatch
- Button is state-guarded: only active when stale, locked while refreshing, auto-disables when data is fresh
- Add server-side API route `/api/health` to query last successful fetch time
- Add server-side API route `/api/refresh` to trigger GitHub Actions workflow_dispatch

## Capabilities

### New Capabilities
- `health-status`: Dashboard health indicator showing pipeline freshness (green/yellow/red), "updated X ago" timestamp, stale warning banner
- `manual-refresh`: Button to trigger light pipeline via GitHub Actions, with state machine guard (idle → refreshing → fresh)

### Modified Capabilities

## Impact

- **Code**: New API routes (`/api/health`, `/api/refresh`), new dashboard component (`health-indicator.tsx`), modified `header.tsx`
- **Environment**: Requires `GH_PAT` secret with `actions:write` permission for workflow_dispatch API
- **GitHub Actions**: No workflow changes needed — `pipeline-light.yml` already supports `workflow_dispatch`
