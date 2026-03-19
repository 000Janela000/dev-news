import type { FetchResult, NewTrackedItem } from "@/lib/types";
import { fetchAllRssFeeds } from "./rss";
import { fetchHackerNews } from "./hackernews";
import { fetchGitHub } from "./github";
import { fetchArxiv } from "./arxiv";

export interface FetchAllResult {
  items: NewTrackedItem[];
  results: FetchResult[];
  totalFetched: number;
  totalSources: number;
  failedSources: number;
}

export async function fetchAllSources(since: Date): Promise<FetchAllResult> {
  console.log(
    `[Pipeline] Fetching all sources since ${since.toISOString()}...`
  );

  // Run all source types concurrently
  const [rssResults, hnResult, githubResult, arxivResult] =
    await Promise.allSettled([
      fetchAllRssFeeds(since),
      fetchHackerNews(since),
      fetchGitHub(since),
      fetchArxiv(since),
    ]);

  const results: FetchResult[] = [];

  // Collect RSS results (array of FetchResult)
  if (rssResults.status === "fulfilled") {
    results.push(...rssResults.value);
  } else {
    results.push({
      source: "rss:all",
      items: [],
      durationMs: 0,
      error: rssResults.reason?.message ?? "RSS fetch failed",
    });
  }

  // Collect individual adapter results
  for (const [name, result] of [
    ["hackernews", hnResult],
    ["github", githubResult],
    ["arxiv", arxivResult],
  ] as const) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      results.push({
        source: name,
        items: [],
        durationMs: 0,
        error: result.reason?.message ?? `${name} fetch failed`,
      });
    }
  }

  // Aggregate
  const allItems = results.flatMap((r) => r.items);
  const failedSources = results.filter((r) => r.error).length;

  // Log summary
  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : `${r.items.length} items`;
    console.log(`  [${r.source}] ${status} (${r.durationMs}ms)`);
  }
  console.log(
    `[Pipeline] Total: ${allItems.length} items from ${results.length} sources (${failedSources} failed)`
  );

  return {
    items: allItems,
    results,
    totalFetched: allItems.length,
    totalSources: results.length,
    failedSources,
  };
}

export { fetchAllRssFeeds } from "./rss";
export { fetchHackerNews } from "./hackernews";
export { fetchGitHub } from "./github";
export { fetchArxiv } from "./arxiv";
