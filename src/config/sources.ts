import type { SourceConfig } from "@/lib/types";

export const SOURCE_REGISTRY: SourceConfig[] = [
  // --- RSS Feeds ---
  {
    id: "rss:anthropic",
    name: "Anthropic Blog",
    type: "rss",
    url: "https://www.anthropic.com/rss.xml",
    enabled: true,
    defaultCategory: "models_releases",
  },
  {
    id: "rss:openai",
    name: "OpenAI Blog",
    type: "rss",
    url: "https://openai.com/blog/rss.xml",
    enabled: true,
    defaultCategory: "models_releases",
  },
  {
    id: "rss:deepmind",
    name: "Google DeepMind Blog",
    type: "rss",
    url: "https://deepmind.google/blog/rss.xml",
    enabled: true,
    defaultCategory: "research_papers",
  },
  {
    id: "rss:meta-ai",
    name: "Meta AI Blog",
    type: "rss",
    url: "https://ai.meta.com/blog/rss/",
    enabled: true,
    defaultCategory: "models_releases",
  },
  {
    id: "rss:huggingface",
    name: "Hugging Face Blog",
    type: "rss",
    url: "https://huggingface.co/blog/feed.xml",
    enabled: true,
    defaultCategory: "tools_frameworks",
  },
  {
    id: "rss:the-decoder",
    name: "The Decoder",
    type: "rss",
    url: "https://the-decoder.com/feed/",
    enabled: true,
    defaultCategory: "industry_trends",
  },
  {
    id: "rss:marktechpost",
    name: "MarkTechPost",
    type: "rss",
    url: "https://www.marktechpost.com/feed/",
    enabled: true,
    defaultCategory: "research_papers",
  },
  {
    id: "rss:venturebeat-ai",
    name: "VentureBeat AI",
    type: "rss",
    url: "https://venturebeat.com/category/ai/feed/",
    enabled: true,
    defaultCategory: "industry_trends",
  },

  // --- APIs ---
  {
    id: "hackernews",
    name: "Hacker News (AI filtered)",
    type: "hackernews",
    url: "https://hn.algolia.com/api/v1",
    enabled: true,
    defaultCategory: "industry_trends",
  },
  {
    id: "github",
    name: "GitHub Trending AI Repos",
    type: "github",
    url: "https://api.github.com/search/repositories",
    enabled: true,
    defaultCategory: "tools_frameworks",
  },
  {
    id: "arxiv:cs-ai",
    name: "ArXiv cs.AI",
    type: "arxiv",
    url: "http://export.arxiv.org/api/query",
    enabled: true,
    defaultCategory: "research_papers",
  },
  {
    id: "arxiv:cs-cl",
    name: "ArXiv cs.CL",
    type: "arxiv",
    url: "http://export.arxiv.org/api/query",
    enabled: true,
    defaultCategory: "research_papers",
  },
];

export function getEnabledSources(type?: SourceConfig["type"]): SourceConfig[] {
  return SOURCE_REGISTRY.filter(
    (s) => s.enabled && (type === undefined || s.type === type)
  );
}
