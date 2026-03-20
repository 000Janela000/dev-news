"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { ItemActions } from "./item-actions";
import type { UserAction } from "@/lib/db/user-state";

const CATEGORY_COLORS: Record<Category, string> = {
  models_releases: "bg-blue-400",
  tools_frameworks: "bg-emerald-400",
  practices_approaches: "bg-amber-400",
  industry_trends: "bg-purple-400",
  research_papers: "bg-rose-400",
};

function getSourceLabel(source: string): string {
  if (source.startsWith("github-release:"))
    return source.replace("github-release:", "");
  if (source.startsWith("reddit:"))
    return "r/" + source.replace("reddit:", "");
  const labels: Record<string, string> = {
    "rss:anthropic": "Anthropic",
    "rss:openai": "OpenAI",
    "rss:deepmind": "DeepMind",
    "rss:huggingface": "HuggingFace",
    "rss:vercel": "Vercel",
    "rss:the-decoder": "The Decoder",
    "rss:ai-news": "AI News",
    "rss:marktechpost": "MarkTechPost",
    "rss:venturebeat-ai": "VentureBeat",
    "rss:microsoft-ai": "Microsoft AI",
    hackernews: "Hacker News",
    github: "GitHub",
    devto: "Dev.to",
  };
  return labels[source] ?? source.replace("rss:", "");
}

interface TrackedItemCardProps {
  id: string;
  title: string;
  summary?: string | null;
  source: string;
  category: Category;
  url: string;
  publishedAt: Date;
  importance?: number | null;
  readingTimeMin?: number;
  clusterSize?: number;
  userStates?: UserAction[];
}

export function TrackedItemCard({
  id,
  title,
  summary,
  source,
  category,
  url,
  publishedAt,
  importance,
  readingTimeMin,
  clusterSize,
  userStates,
}: TrackedItemCardProps) {
  return (
    <div className="group relative">
      <Link
        href={`/item/${id}`}
        className="block rounded-lg border border-transparent p-4 transition-all hover:border-border/50 hover:bg-muted/30"
      >
        {/* Category indicator + title */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-1.5 size-1.5 shrink-0 rounded-full",
              CATEGORY_COLORS[category]
            )}
            title={CATEGORY_LABELS[category]}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-medium leading-snug tracking-tight">
              {title}
            </h3>

            {summary && (
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {summary}
              </p>
            )}

            {/* Metadata line */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/60">
              <span>{getSourceLabel(source)}</span>
              <span>·</span>
              <span>
                {formatDistanceToNow(new Date(publishedAt), {
                  addSuffix: true,
                })}
              </span>
              {readingTimeMin && (
                <>
                  <span>·</span>
                  <span>{readingTimeMin}m read</span>
                </>
              )}
              {clusterSize && clusterSize > 1 && (
                <>
                  <span>·</span>
                  <span className="text-purple-400/70">
                    {clusterSize} sources
                  </span>
                </>
              )}
              {importance && importance >= 4 && (
                <>
                  <span>·</span>
                  <span className="text-amber-400/70">high impact</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Actions — appear on hover */}
      <div className="absolute right-3 top-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <ItemActions itemId={id} initialStates={userStates} compact />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
