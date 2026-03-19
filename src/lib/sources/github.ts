import { nanoid } from "@/lib/id";
import type { DataSource, FetchResult, NewTrackedItem } from "@/lib/types";

const GITHUB_SEARCH_URL = "https://api.github.com/search/repositories";
const RATE_DELAY_MS = 2_100; // 2.1s between requests (30 req/min limit)
const FETCH_TIMEOUT_MS = 10_000;

const AI_QUERIES = [
  "topic:artificial-intelligence",
  "topic:llm",
  "topic:machine-learning",
  '"AI" in:description language:python',
  '"AI" in:description language:typescript',
];

interface GitHubRepo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubSearchResponse {
  total_count: number;
  items: GitHubRepo[];
}

function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function searchGitHub(
  query: string,
  since: Date,
  token?: string
): Promise<GitHubRepo[]> {
  const dateStr = getDateString(since);
  const fullQuery = `${query} created:>${dateStr} stars:>10 sort:stars`;

  const url = new URL(GITHUB_SEARCH_URL);
  url.searchParams.set("q", fullQuery);
  url.searchParams.set("per_page", "20");
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AI-Dev-Tracker/1.0",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[GitHub] Search failed (${res.status}): ${fullQuery}`);
      return [];
    }

    const data = (await res.json()) as GitHubSearchResponse;
    return data.items;
  } catch (error) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[GitHub] Search error: ${msg}`);
    return [];
  }
}

function repoToTrackedItem(repo: GitHubRepo): NewTrackedItem {
  return {
    id: nanoid(),
    url: repo.html_url,
    urlNormalized: "", // filled by dedup layer
    title: repo.full_name,
    content: repo.description ?? "",
    source: "github",
    sourceType: "github",
    category: "tools_frameworks",
    tags: repo.topics.slice(0, 10),
    metadata: {
      stars: repo.stargazers_count,
      language: repo.language,
      owner: repo.owner.login,
      ownerAvatar: repo.owner.avatar_url,
      pushedAt: repo.pushed_at,
    },
    publishedAt: new Date(repo.created_at),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const githubAdapter: DataSource = {
  name: "github",
  type: "github",
  isEnabled: () => true,

  async fetch(since: Date): Promise<NewTrackedItem[]> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn(
        "[GitHub] GITHUB_TOKEN not set — using unauthenticated requests (10 req/min)"
      );
    }

    const seenIds = new Set<number>();
    const items: NewTrackedItem[] = [];

    for (let i = 0; i < AI_QUERIES.length; i++) {
      if (i > 0) await delay(RATE_DELAY_MS);
      const repos = await searchGitHub(AI_QUERIES[i], since, token);
      for (const repo of repos) {
        if (seenIds.has(repo.id)) continue;
        seenIds.add(repo.id);
        items.push(repoToTrackedItem(repo));
      }
    }

    return items;
  },
};

export async function fetchGitHub(since: Date): Promise<FetchResult> {
  const start = Date.now();
  try {
    const items = await githubAdapter.fetch(since);
    return {
      source: "github",
      items,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      source: "github",
      items: [],
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
