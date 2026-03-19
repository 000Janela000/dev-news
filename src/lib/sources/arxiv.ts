import Parser from "rss-parser";
import { nanoid } from "@/lib/id";
import type { DataSource, FetchResult, NewTrackedItem } from "@/lib/types";

const ARXIV_API_URL = "http://export.arxiv.org/api/query";
const RATE_DELAY_MS = 3_100; // 3s+ mandatory delay per ArXiv policy
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESULTS = 50;

// ArXiv categories to query
const CATEGORIES = ["cs.AI", "cs.CL", "cs.LG"];

const parser = new Parser({
  maxRedirects: 3,
});

async function fetchArxivCategory(
  category: string,
  maxResults: number
): Promise<NewTrackedItem[]> {
  const url = new URL(ARXIV_API_URL);
  url.searchParams.set("search_query", `cat:${category}`);
  url.searchParams.set("sortBy", "submittedDate");
  url.searchParams.set("sortOrder", "descending");
  url.searchParams.set("max_results", String(maxResults));
  url.searchParams.set("start", "0");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "AI-Dev-Tracker/1.0" },
    });
    clearTimeout(timeout);

    const xml = await res.text();
    const feed = await parser.parseString(xml);
    const items: NewTrackedItem[] = [];

    for (const entry of feed.items) {
      if (!entry.title || !entry.link) continue;

      // Clean up ArXiv titles (remove newlines and extra whitespace)
      const title = entry.title.replace(/\s+/g, " ").trim();
      const abstract = (entry.contentSnippet || entry.content || "")
        .replace(/\s+/g, " ")
        .trim();

      // Extract ArXiv ID from link
      const arxivIdMatch = entry.link.match(/abs\/(\d+\.\d+)/);
      const arxivId = arxivIdMatch?.[1] ?? "";

      items.push({
        id: nanoid(),
        url: entry.link,
        urlNormalized: "", // filled by dedup layer
        title,
        content: abstract.slice(0, 10_000),
        source: `arxiv:${category.toLowerCase().replace(".", "-")}`,
        sourceType: "arxiv",
        category: "research_papers",
        tags: [category],
        metadata: {
          arxivId,
          categories: entry.categories ?? [category],
          authors: entry.creator ?? "",
          pdfUrl: arxivId
            ? `https://arxiv.org/pdf/${arxivId}.pdf`
            : undefined,
        },
        publishedAt: entry.pubDate ? new Date(entry.pubDate) : new Date(),
      });
    }

    return items;
  } catch (error) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ArXiv] Fetch failed for ${category}: ${msg}`);
    return [];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const arxivAdapter: DataSource = {
  name: "arxiv",
  type: "arxiv",
  isEnabled: () => true,

  async fetch(since: Date): Promise<NewTrackedItem[]> {
    const allItems: NewTrackedItem[] = [];
    const seenUrls = new Set<string>();

    for (let i = 0; i < CATEGORIES.length; i++) {
      if (i > 0) await delay(RATE_DELAY_MS);

      const items = await fetchArxivCategory(CATEGORIES[i], MAX_RESULTS);

      for (const item of items) {
        // Filter by date and dedup across categories
        if (item.publishedAt < since) continue;
        if (seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);
        allItems.push(item);
      }
    }

    return allItems;
  },
};

export async function fetchArxiv(since: Date): Promise<FetchResult> {
  const start = Date.now();
  try {
    const items = await arxivAdapter.fetch(since);
    return {
      source: "arxiv",
      items,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      source: "arxiv",
      items: [],
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
