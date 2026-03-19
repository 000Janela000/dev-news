import { z } from "zod/v4";

export const CategoryEnum = z.enum([
  "models_releases",
  "tools_frameworks",
  "practices_approaches",
  "industry_trends",
  "research_papers",
]);
export type Category = z.infer<typeof CategoryEnum>;

export const CATEGORY_LABELS: Record<Category, string> = {
  models_releases: "Models & Releases",
  tools_frameworks: "Tools & Frameworks",
  practices_approaches: "Practices & Approaches",
  industry_trends: "Industry & Trends",
  research_papers: "Research & Papers",
};

export const SourceTypeEnum = z.enum([
  "rss",
  "hackernews",
  "github",
  "arxiv",
]);
export type SourceType = z.infer<typeof SourceTypeEnum>;

export const TrackedItemSchema = z.object({
  id: z.string(),
  url: z.url(),
  urlNormalized: z.string(),
  title: z.string().min(1),
  content: z.string().optional(),
  summary: z.string().optional(),
  source: z.string(),
  sourceType: SourceTypeEnum,
  category: CategoryEnum,
  importance: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  publishedAt: z.date(),
  fetchedAt: z.date(),
  summarizedAt: z.date().optional(),
});
export type TrackedItem = z.infer<typeof TrackedItemSchema>;

export const NewTrackedItemSchema = TrackedItemSchema.omit({
  fetchedAt: true,
  summarizedAt: true,
});
export type NewTrackedItem = z.infer<typeof NewTrackedItemSchema>;
