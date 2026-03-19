import { nanoid } from "@/lib/id";
import type { DataSource, FetchResult, NewTrackedItem } from "@/lib/types";

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1/search_by_date";

const AI_QUERIES = [
  "LLM",
  "Claude",
  "GPT",
  "machine learning",
  "AI coding",
  "AI agent",
  "generative AI",
  "transformer model",
];

const FETCH_TIMEOUT_MS = 10_000;
const HITS_PER_PAGE = 50;
const MIN_POINTS = 5;

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  url: string | null;
  story_url?: string | null;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  created_at_i: number;
  story_text?: string | null;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbHits: number;
}

async function searchHN(
  query: string,
  sinceUnix: number
): Promise<AlgoliaHit[]> {
  const url = new URL(ALGOLIA_BASE);
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "story");
  url.searchParams.set(
    "numericFilters",
    `created_at_i>${sinceUnix},points>${MIN_POINTS}`
  );
  url.searchParams.set("hitsPerPage", String(HITS_PER_PAGE));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`[HN] Algolia query "${query}" failed: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as AlgoliaResponse;
    return data.hits;
  } catch (error) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[HN] Algolia query "${query}" error: ${msg}`);
    return [];
  }
}

function hitToTrackedItem(hit: AlgoliaHit): NewTrackedItem | null {
  const itemUrl = hit.url || hit.story_url;
  if (!hit.title || !itemUrl) return null;

  return {
    id: nanoid(),
    url: itemUrl,
    urlNormalized: "", // filled by dedup layer
    title: hit.title,
    content: hit.story_text ?? "",
    source: "hackernews",
    sourceType: "hackernews",
    category: "industry_trends", // default, refined by summarizer later
    tags: [],
    metadata: {
      hnId: hit.objectID,
      author: hit.author,
      points: hit.points,
      numComments: hit.num_comments,
      hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    },
    publishedAt: new Date(hit.created_at),
  };
}

export const hackernewsAdapter: DataSource = {
  name: "hackernews",
  type: "hackernews",
  isEnabled: () => true,

  async fetch(since: Date): Promise<NewTrackedItem[]> {
    const sinceUnix = Math.floor(since.getTime() / 1000);
    const seenIds = new Set<string>();
    const items: NewTrackedItem[] = [];

    // Run queries sequentially to be respectful of the API
    for (const query of AI_QUERIES) {
      const hits = await searchHN(query, sinceUnix);
      for (const hit of hits) {
        if (seenIds.has(hit.objectID)) continue;
        seenIds.add(hit.objectID);
        const item = hitToTrackedItem(hit);
        if (item) items.push(item);
      }
    }

    return items;
  },
};

export async function fetchHackerNews(since: Date): Promise<FetchResult> {
  const start = Date.now();
  try {
    const items = await hackernewsAdapter.fetch(since);
    return {
      source: "hackernews",
      items,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      source: "hackernews",
      items: [],
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
