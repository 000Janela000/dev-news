import Parser from "rss-parser";
import { nanoid } from "@/lib/id";
import { getEnabledSources } from "@/config/sources";
import type { DataSource, FetchResult, NewTrackedItem } from "@/lib/types";

type CustomItem = {
  "content:encoded"?: string;
  fullContent?: string;
};

const parser = new Parser<Record<string, never>, CustomItem>({
  customFields: {
    item: [["content:encoded", "fullContent"]],
  },
  maxRedirects: 3,
});

const FETCH_TIMEOUT_MS = 10_000;

async function fetchFeedSafe(
  url: string
): Promise<Parser.Output<CustomItem> | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AI-Dev-Tracker/1.0" },
    });
    clearTimeout(timeout);
    const xml = await response.text();
    return await parser.parseString(xml);
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[RSS] Feed fetch failed for ${url}: ${message}`);
    return null;
  }
}

async function fetchSingleFeed(
  sourceId: string,
  url: string,
  defaultCategory: NewTrackedItem["category"],
  since: Date
): Promise<NewTrackedItem[]> {
  const feed = await fetchFeedSafe(url);
  if (!feed?.items) return [];

  const items: NewTrackedItem[] = [];
  for (const entry of feed.items) {
    if (!entry.title || !entry.link) continue;

    const pubDate = entry.pubDate ? new Date(entry.pubDate) : new Date();
    if (pubDate < since) continue;

    const content =
      entry.fullContent || entry.contentSnippet || entry.content || "";

    items.push({
      id: nanoid(),
      url: entry.link,
      urlNormalized: "", // filled by dedup layer
      title: entry.title,
      content: content.slice(0, 10_000), // cap content size
      source: sourceId,
      sourceType: "rss",
      category: defaultCategory,
      tags: entry.categories ?? [],
      metadata: {
        feedTitle: feed.title ?? "",
        author: entry.creator ?? "",
      },
      publishedAt: pubDate,
    });
  }

  return items;
}

export function createRssAdapters(): DataSource[] {
  const rssSources = getEnabledSources("rss");

  return rssSources.map((source) => ({
    name: source.id,
    type: source.type,
    isEnabled: () => source.enabled,
    async fetch(since: Date): Promise<NewTrackedItem[]> {
      if (!source.url) return [];
      return fetchSingleFeed(
        source.id,
        source.url,
        source.defaultCategory,
        since
      );
    },
  }));
}

export async function fetchAllRssFeeds(
  since: Date
): Promise<FetchResult[]> {
  const adapters = createRssAdapters();
  const results: FetchResult[] = [];

  // Fetch feeds concurrently
  const promises = adapters.map(async (adapter) => {
    const start = Date.now();
    try {
      const items = await adapter.fetch(since);
      return {
        source: adapter.name,
        items,
        durationMs: Date.now() - start,
      } satisfies FetchResult;
    } catch (error) {
      return {
        source: adapter.name,
        items: [],
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      } satisfies FetchResult;
    }
  });

  const settled = await Promise.allSettled(promises);
  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    }
  }

  return results;
}
