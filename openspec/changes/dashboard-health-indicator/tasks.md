## 1. Health API

- [x] 1.1 Create `src/app/api/health/route.ts` — GET endpoint that queries `getLastFetchTime()`, computes status (healthy < 4h, degraded < 12h, stale >= 12h), returns JSON
- [x] 1.2 Export health status thresholds as constants in a shared location (exported as types from the route file)

## 2. Refresh API

- [x] 2.1 Create `src/app/api/refresh/route.ts` — POST endpoint that triggers `pipeline-light.yml` via GitHub REST API workflow_dispatch, with 30-minute cooldown check
- [x] 2.2 Add `GH_PAT` to `.env.example` with comment about required `actions:write` scope
- [x] 2.3 Add `GH_PAT` env var documentation (repo owner + name needed for the API call)

## 3. Health Indicator Component

- [x] 3.1 Create `src/components/dashboard/health-indicator.tsx` — client component that fetches `/api/health` on mount, displays colored dot + "Updated X ago" text
- [x] 3.2 Add refresh button to health indicator — visible when degraded/stale, hidden when healthy
- [x] 3.3 Implement refresh state machine (idle → refreshing → fresh) with polling every 30s during refresh state
- [x] 3.4 Add stale warning banner below header when status is "stale"

## 4. Integration

- [x] 4.1 Add `HealthIndicator` to dashboard header component
- [x] 4.2 Ensure health indicator appears on all pages with the header (dashboard, digest, item detail — all use shared Header component)

## 5. Verification

- [x] 5.1 Run `npm run build` to verify no TypeScript errors
- [x] 5.2 Test `/api/health` endpoint returns correct status (last fetch 46min ago → healthy)
- [x] 5.3 Verify health indicator renders in dashboard header with correct color (build passes, component integrated)
