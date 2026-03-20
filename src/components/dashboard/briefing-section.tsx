"use client";

import { Clock } from "lucide-react";
import { TrackedItemCard } from "./tracked-item-card";
import type { ItemRow } from "@/lib/db";
import type { Category } from "@/lib/types";
import type { UserAction } from "@/lib/db/user-state";
import { useUserStates } from "@/hooks/use-user-states";
import { useMemo } from "react";

interface BriefingItem extends ItemRow {
  readingTimeMin: number;
}

interface BriefingSectionProps {
  items: BriefingItem[];
  totalMinutes: number;
}

export function BriefingSection({ items, totalMinutes }: BriefingSectionProps) {
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const { states: userStates } = useUserStates(itemIds);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Nothing new right now. Check back later.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Briefing header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Your Briefing
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            {items.length} items curated for you
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1">
          <Clock className="size-3 text-muted-foreground/60" />
          <span className="text-xs font-medium text-muted-foreground">
            ~{totalMinutes}m
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/30">
        {items.map((item) => (
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
            readingTimeMin={item.readingTimeMin}
            clusterSize={
              "clusterSize" in item
                ? (item.clusterSize as number)
                : undefined
            }
            userStates={userStates[item.id] as UserAction[] | undefined}
          />
        ))}
      </div>
    </div>
  );
}
