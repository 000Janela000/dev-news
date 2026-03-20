## Context

The `fetchLogs` table already tracks every pipeline run with `fetchedAt` timestamps and `error` status. The query `getLastFetchTime()` in `mutations.ts` already returns the most recent successful fetch time. The light pipeline workflow (`pipeline-light.yml`) already has `workflow_dispatch: {}` enabled.

The dashboard header (`src/components/dashboard/header.tsx`) is a shared component across all pages.

## Goals / Non-Goals

**Goals:**
- Show pipeline freshness status at a glance on every page
- Allow any visitor to trigger a manual refresh when data is stale
- Prevent abuse without requiring auth

**Non-Goals:**
- Alerting via external services (Slack, email, PagerDuty)
- Monitoring individual source health (just aggregate pipeline health)
- Historical health dashboard or uptime tracking

## Decisions

### 1. Health status from fetch_logs, computed server-side

The `/api/health` route queries `getLastFetchTime()` and returns the timestamp + computed status (green/yellow/red). The dashboard header fetches this on mount via client-side fetch. This avoids passing health data through every server component.

**Thresholds:**
- Green: last fetch < 4 hours ago
- Yellow: 4-12 hours ago
- Red: 12+ hours ago

**Why not compute client-side:** The fetch_logs table is the source of truth. Client clocks can be wrong.

### 2. Manual refresh triggers GitHub Actions via REST API

The `/api/refresh` POST route calls the GitHub Actions API to trigger `pipeline-light.yml` via `workflow_dispatch`. This uses a server-side `GH_PAT` token with `actions:write` scope — never exposed to the client.

**Why GitHub Actions, not Vercel serverless:** The pipeline takes 2-3 minutes. Vercel free tier has a 10-second timeout. GitHub Actions is the only viable execution environment.

### 3. State machine in the UI, not the backend

The refresh button has three states: `idle`, `refreshing`, `fresh`. State transitions happen client-side:
- `idle` → press button → `refreshing`
- `refreshing` → poll `/api/health` every 30s → when last fetch is newer than when button was pressed → `fresh`
- `fresh` → button disabled (data is current)

On page load, if health is green → state is `fresh` (button hidden/disabled). If yellow/red → state is `idle`.

No server-side state needed. The button's "lock" is entirely determined by comparing the health timestamp against the time the button was pressed.

### 4. Rate limiting via simple timestamp check

The `/api/refresh` route checks: was the last successful fetch less than 30 minutes ago? If yes, reject with 429. This prevents spam without needing auth or IP tracking. Combined with the UI state guard, this provides double protection.

## Risks / Trade-offs

**[GH_PAT token scope]** → The token needs `actions:write` which also allows other workflow operations. Mitigation: use a fine-grained PAT scoped only to this repository.

**[Polling during refresh]** → Client polls `/api/health` every 30s while in `refreshing` state. This adds DB queries. Mitigation: the poll is lightweight (single row query) and only happens during the ~3 minute refresh window.

**[GitHub API rate limits]** → The workflow_dispatch API counts against the PAT's rate limit (5000/hr authenticated). A 30-minute cooldown makes this a non-issue (~48 max triggers/day).
