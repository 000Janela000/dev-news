import normalizeUrl from "normalize-url";
import type { NewTrackedItem } from "@/lib/types";

export function normalizeItemUrl(url: string): string {
  try {
    return normalizeUrl(url, {
      stripProtocol: false,
      stripWWW: true,
      stripHash: true,
      removeQueryParameters: [
        /^utm_/i,
        "ref",
        "source",
        "fbclid",
        "gclid",
        "mc_cid",
        "mc_eid",
      ],
      removeTrailingSlash: true,
      sortQueryParameters: true,
    });
  } catch {
    // If normalize-url fails (invalid URL), return as-is
    return url;
  }
}

/** Tokenize a string into lowercase words (3+ chars) */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/** Jaccard similarity between two sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize++;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/** Check if two titles are similar enough to be considered duplicates */
export function isTitleDuplicate(
  title1: string,
  title2: string,
  threshold = 0.6
): boolean {
  return jaccardSimilarity(tokenize(title1), tokenize(title2)) > threshold;
}

/** Deduplicate items by URL normalization and title similarity */
export function deduplicateItems(items: NewTrackedItem[]): {
  unique: NewTrackedItem[];
  duplicatesRemoved: number;
} {
  const seen = new Map<string, NewTrackedItem>();
  const titles: Array<{ normalized: string; title: string }> = [];
  let duplicatesRemoved = 0;

  for (const item of items) {
    // Normalize URL
    const normalized = normalizeItemUrl(item.url);
    const itemWithNorm = { ...item, urlNormalized: normalized };

    // Layer 1: URL dedup
    if (seen.has(normalized)) {
      duplicatesRemoved++;
      // Keep the one with more content
      const existing = seen.get(normalized)!;
      if ((item.content?.length ?? 0) > (existing.content?.length ?? 0)) {
        seen.set(normalized, itemWithNorm);
      }
      continue;
    }

    // Layer 2: Title similarity dedup
    let isDup = false;
    for (const entry of titles) {
      if (isTitleDuplicate(item.title, entry.title)) {
        duplicatesRemoved++;
        isDup = true;
        // Keep the one with more content
        const existing = seen.get(entry.normalized)!;
        if ((item.content?.length ?? 0) > (existing.content?.length ?? 0)) {
          seen.delete(entry.normalized);
          seen.set(normalized, itemWithNorm);
          entry.normalized = normalized;
          entry.title = item.title;
        }
        break;
      }
    }

    if (!isDup) {
      seen.set(normalized, itemWithNorm);
      titles.push({ normalized, title: item.title });
    }
  }

  return {
    unique: Array.from(seen.values()),
    duplicatesRemoved,
  };
}
