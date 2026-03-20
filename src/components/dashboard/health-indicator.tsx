"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthResponse, HealthStatus } from "@/app/api/health/route";

type RefreshState = "idle" | "refreshing" | "fresh";

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  stale: "bg-red-500",
};

function formatAgo(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HealthIndicator() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [refreshState, setRefreshState] = useState<RefreshState>("idle");
  const triggeredAt = useRef<number>(0);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealth(data);
        return data;
      }
    } catch {
      // Silently fail — indicator just won't update
    }
    return null;
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHealth().then((data) => {
      if (data?.status === "healthy") {
        setRefreshState("fresh");
      }
    });
  }, [fetchHealth]);

  // Polling during refresh state
  useEffect(() => {
    if (refreshState === "refreshing") {
      pollInterval.current = setInterval(async () => {
        const data = await fetchHealth();
        if (data?.lastFetch) {
          const fetchTime = new Date(data.lastFetch).getTime();
          if (fetchTime > triggeredAt.current) {
            setRefreshState("fresh");
          }
        }
      }, 30_000);
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [refreshState, fetchHealth]);

  const handleRefresh = async () => {
    if (refreshState === "refreshing") return;

    setRefreshState("refreshing");
    triggeredAt.current = Date.now();

    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        if (data.reason === "cooldown") {
          // Still in cooldown — revert to idle
          setRefreshState("idle");
        } else {
          setRefreshState("idle");
        }
      }
    } catch {
      setRefreshState("idle");
    }
  };

  if (!health) return null;

  const showButton = health.status !== "healthy" && refreshState !== "fresh";
  const isRefreshing = refreshState === "refreshing";

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status dot + text */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              STATUS_COLORS[health.status]
            )}
          />
          <span className="text-xs text-muted-foreground">
            {health.agoMs !== null
              ? `Updated ${formatAgo(health.agoMs)}`
              : "No data yet"}
          </span>
        </div>

        {/* Refresh button */}
        {showButton && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium transition-colors",
              isRefreshing
                ? "cursor-not-allowed text-muted-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <RefreshCw
              className={cn("size-3", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      {/* Stale warning banner */}
      {health.status === "stale" && refreshState !== "refreshing" && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              Data hasn&apos;t been updated in over 12 hours.
              {!showButton && " A refresh was triggered — waiting for new data."}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
