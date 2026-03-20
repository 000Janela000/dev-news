import { NextResponse } from "next/server";
import { getLastFetchTime } from "@/lib/db";

const HEALTHY_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
const DEGRADED_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

export type HealthStatus = "healthy" | "degraded" | "stale";

export interface HealthResponse {
  status: HealthStatus;
  lastFetch: string | null;
  agoMs: number | null;
}

function computeStatus(agoMs: number): HealthStatus {
  if (agoMs < HEALTHY_THRESHOLD_MS) return "healthy";
  if (agoMs < DEGRADED_THRESHOLD_MS) return "degraded";
  return "stale";
}

export async function GET() {
  try {
    const lastFetch = await getLastFetchTime();

    if (!lastFetch) {
      return NextResponse.json<HealthResponse>({
        status: "stale",
        lastFetch: null,
        agoMs: null,
      });
    }

    const agoMs = Date.now() - lastFetch.getTime();

    return NextResponse.json<HealthResponse>({
      status: computeStatus(agoMs),
      lastFetch: lastFetch.toISOString(),
      agoMs,
    });
  } catch {
    return NextResponse.json<HealthResponse>(
      { status: "stale", lastFetch: null, agoMs: null },
      { status: 503 }
    );
  }
}
