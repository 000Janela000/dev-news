import { NextResponse } from "next/server";
import { getLastFetchTime } from "@/lib/db";

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

const GITHUB_REPO = process.env.GITHUB_REPO ?? "000Janela000/dev-news";
const WORKFLOW_FILE = "pipeline-light.yml";

interface RefreshResponse {
  triggered: boolean;
  reason?: string;
  retryAfterMs?: number;
}

export async function POST() {
  const ghToken = process.env.GH_PAT;
  if (!ghToken) {
    return NextResponse.json<RefreshResponse>(
      { triggered: false, reason: "not_configured" },
      { status: 503 }
    );
  }

  // Check cooldown
  try {
    const lastFetch = await getLastFetchTime();
    if (lastFetch) {
      const elapsed = Date.now() - lastFetch.getTime();
      if (elapsed < COOLDOWN_MS) {
        return NextResponse.json<RefreshResponse>(
          {
            triggered: false,
            reason: "cooldown",
            retryAfterMs: COOLDOWN_MS - elapsed,
          },
          { status: 429 }
        );
      }
    }
  } catch {
    // If we can't check cooldown, allow the trigger
  }

  // Trigger GitHub Actions workflow_dispatch
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DevNews/1.0",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Refresh] GitHub API error: ${res.status} ${text}`);
      return NextResponse.json<RefreshResponse>(
        { triggered: false, reason: "github_error" },
        { status: 502 }
      );
    }

    return NextResponse.json<RefreshResponse>({ triggered: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Refresh] Failed to trigger workflow: ${msg}`);
    return NextResponse.json<RefreshResponse>(
      { triggered: false, reason: "network_error" },
      { status: 502 }
    );
  }
}
