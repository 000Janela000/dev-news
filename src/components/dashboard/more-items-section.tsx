"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TrackedItemCard } from "./tracked-item-card";
import { useUserStates } from "@/hooks/use-user-states";
import type { ItemRow } from "@/lib/db";
import type { Category } from "@/lib/types";
import type { UserAction } from "@/lib/db/user-state";

interface MoreItemsSectionProps {
  items: ItemRow[];
}

export function MoreItemsSection({ items }: MoreItemsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const itemIds = useMemo(() => items.map((i) => i.id), [items]);
  const { states: userStates } = useUserStates(expanded ? itemIds : []);

  if (items.length === 0) return null;

  return (
    <div className="mt-8 border-t border-border/30 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-2 text-sm text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <span>
          {items.length} more item{items.length !== 1 ? "s" : ""}
        </span>
        {expanded ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 divide-y divide-border/30">
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
              clusterSize={
                "clusterSize" in item
                  ? (item.clusterSize as number)
                  : undefined
              }
              userStates={userStates[item.id] as UserAction[] | undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
