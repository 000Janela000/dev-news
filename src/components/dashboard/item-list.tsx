"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, Inbox } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/lib/types";
import type { ItemRow } from "@/lib/db";
import { CategoryTabs } from "./category-tabs";
import { TimeFilter, type TimeRange } from "./time-filter";
import { TrackedItemCard } from "./tracked-item-card";
import { useUserStates } from "@/hooks/use-user-states";

interface ItemListProps {
  items: ItemRow[];
  loading?: boolean;
}

export type ScopeFilter = "dev" | "dev+industry" | "everything";

export function ItemList({ items, loading }: ItemListProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">(
    "all"
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("dev");
  const [serverResults, setServerResults] = useState<ItemRow[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced server search for queries beyond loaded items
  const doServerSearch = useCallback((query: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim().length < 3) {
      setServerResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setServerResults(data.items ?? []);
        }
      } catch {
        setServerResults([]);
      }
    }, 400);
  }, []);

  useEffect(() => {
    doServerSearch(search);
  }, [search, doServerSearch]);

  // Batch-load user states for all items
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const { states: userStates } = useUserStates(itemIds);

  // Compute counts per category
  const counts = useMemo(() => {
    const c: Partial<Record<Category, number>> = {};
    for (const item of items) {
      const cat = item.category as Category;
      c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [items]);

  // Filter items
  const filtered = useMemo(() => {
    let result = items;

    // Scope filter (dev relevance)
    if (scope === "dev") {
      result = result.filter(
        (i) => !i.devRelevance || i.devRelevance === "direct"
      );
    } else if (scope === "dev+industry") {
      result = result.filter(
        (i) =>
          !i.devRelevance ||
          i.devRelevance === "direct" ||
          i.devRelevance === "indirect"
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((i) => i.category === selectedCategory);
    }

    // Time filter
    const now = new Date();
    if (timeRange === "today") {
      const start = startOfDay(now);
      result = result.filter((i) => new Date(i.publishedAt) >= start);
    } else if (timeRange === "week") {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      result = result.filter((i) => new Date(i.publishedAt) >= start);
    } else if (timeRange === "month") {
      const start = startOfMonth(now);
      result = result.filter((i) => new Date(i.publishedAt) >= start);
    }

    // Search filter (client-side on loaded items)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.content?.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q)
      );

      // Merge server search results (deduped by id)
      if (serverResults.length > 0) {
        const existingIds = new Set(result.map((i) => i.id));
        for (const sr of serverResults) {
          if (!existingIds.has(sr.id)) {
            result.push(sr);
          }
        }
      }
    }

    return result;
  }, [items, selectedCategory, timeRange, search, scope, serverResults]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <CategoryTabs
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          counts={counts}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TimeFilter selected={timeRange} onSelect={setTimeRange} />
            <div className="flex gap-0.5 rounded-md border border-border p-0.5">
              {(
                [
                  ["dev", "Dev Focus"],
                  ["dev+industry", "Dev + Industry"],
                  ["everything", "Everything"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setScope(value)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                    scope === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState hasItems={items.length > 0} />
      ) : (
        <div className="grid gap-2">
          {filtered.map((item) => (
            <TrackedItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              summary={item.summary}
              source={item.source}
              category={item.category as Category}
              url={item.url}
              publishedAt={item.publishedAt}
              importance={item.importance}
              userStates={userStates[item.id]}
              clusterSize={"clusterSize" in item ? (item.clusterSize as number) : undefined}
            />
          ))}
        </div>
      )}

      {/* Count */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {filtered.length} of {items.length} items
        </p>
      )}
    </div>
  );
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16">
      <Inbox className="size-10 text-muted-foreground/50" />
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {hasItems ? "No items match your filters" : "No items yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {hasItems
            ? "Try adjusting category, time range, or search"
            : "Run the pipeline to fetch data: npm run pipeline"}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex gap-1.5 mb-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1 h-3 w-2/3" />
            <Skeleton className="mt-2.5 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
