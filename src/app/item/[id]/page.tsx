import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ItemActions } from "@/components/dashboard/item-actions";
import { Header } from "@/components/dashboard/header";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import {
  getItemById,
  getItemsByCategory,
  getItemsByDateRange,
} from "@/lib/db/queries";
import { clusterItems } from "@/lib/clustering";
import { stripHtml, isContentTruncated } from "@/lib/html";

export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<Category, string> = {
  models_releases: "bg-blue-400",
  tools_frameworks: "bg-emerald-400",
  practices_approaches: "bg-amber-400",
  industry_trends: "bg-purple-400",
  research_papers: "bg-rose-400",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params;

  let item: Awaited<ReturnType<typeof getItemById>>;
  let related: Awaited<ReturnType<typeof getItemsByCategory>> = [];
  let clusterSources: Awaited<ReturnType<typeof getItemById>>[] = [];

  try {
    item = await getItemById(id);
    if (!item) notFound();
    related = await getItemsByCategory(item.category as Category, 5);
    related = related.filter((r) => r.id !== item!.id).slice(0, 4);

    const dayBefore = new Date(
      new Date(item.publishedAt).getTime() - 24 * 60 * 60 * 1000
    );
    const dayAfter = new Date(
      new Date(item.publishedAt).getTime() + 24 * 60 * 60 * 1000
    );
    const nearby = await getItemsByDateRange(dayBefore, dayAfter);
    const clustered = clusterItems(nearby);
    const myCluster = clustered.find((c) => c.clusterItemIds.includes(id));
    if (myCluster && myCluster.clusterSize > 1) {
      const otherIds = myCluster.clusterItemIds.filter((cid) => cid !== id);
      const others = await Promise.all(
        otherIds.map((cid) => getItemById(cid))
      );
      clusterSources = others.filter(Boolean) as NonNullable<typeof item>[];
    }
  } catch {
    notFound();
  }

  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  const hnUrl = metadata.hnUrl as string | undefined;
  const pdfUrl = metadata.pdfUrl as string | undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          <ArrowLeft className="size-3" />
          Back
        </Link>

        <article className="space-y-6">
          {/* Category + Title */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground/60">
              <span
                className={`inline-block size-1.5 rounded-full ${CATEGORY_COLORS[item.category as Category]}`}
              />
              <span>{CATEGORY_LABELS[item.category as Category]}</span>
              <span>·</span>
              <span>{item.source.replace("rss:", "")}</span>
              <span>·</span>
              <span>
                {format(new Date(item.publishedAt), "MMM d, yyyy")}
              </span>
              {item.importance && item.importance >= 4 && (
                <>
                  <span>·</span>
                  <span className="text-amber-400/70">high impact</span>
                </>
              )}
            </div>

            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {item.title}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ItemActions itemId={item.id} compact={false} />
            <div className="flex items-center gap-2 text-xs">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                <ExternalLink className="size-3" />
                Original
              </a>
              {hnUrl && (
                <a
                  href={hnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400/60 transition-colors hover:text-orange-400"
                >
                  HN
                </a>
              )}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400/60 transition-colors hover:text-red-400"
                >
                  PDF
                </a>
              )}
            </div>
          </div>

          {/* Summary */}
          {item.summary && (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-[13px] leading-relaxed">{item.summary}</p>
            </div>
          )}

          {/* Content */}
          {item.content && (
            <div>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                {stripHtml(item.content, 10000)}
              </p>
              {isContentTruncated(item.content) && (
                <p className="mt-3 text-[11px] text-muted-foreground/40 italic">
                  Truncated — open original for full article.
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Cluster sources */}
          {clusterSources.length > 0 && (
            <div className="border-t border-border/30 pt-6">
              <p className="mb-3 text-xs text-purple-400/70">
                Also covered by {clusterSources.length} other source
                {clusterSources.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {clusterSources.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/30"
                  >
                    <div>
                      <p className="text-sm">{s.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                        {s.source.replace("rss:", "")} ·{" "}
                        {formatDistanceToNow(new Date(s.publishedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground/30" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="border-t border-border/30 pt-6">
              <p className="mb-3 text-xs text-muted-foreground/50">Related</p>
              <div className="space-y-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/item/${r.id}`}
                    className="block rounded-lg p-3 transition-colors hover:bg-muted/30"
                  >
                    <p className="text-sm">{r.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                      {r.source.replace("rss:", "")} ·{" "}
                      {formatDistanceToNow(new Date(r.publishedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
