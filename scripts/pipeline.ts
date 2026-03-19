/**
 * Data Pipeline Script
 *
 * Orchestrates: fetch → dedup → store for all enabled sources.
 * Run with: npx tsx scripts/pipeline.ts
 */

import { nanoid } from "@/lib/id";
import { fetchAllSources } from "@/lib/sources";
import { deduplicateItems, upsertItems, logFetchRun, getLastFetchTime, pruneOldItems } from "@/lib/db";

const DEFAULT_LOOKBACK_HOURS = 24;

async function main() {
  const pipelineRunId = nanoid(12);
  const startedAt = new Date();

  console.log(`\n========================================`);
  console.log(`Pipeline Run: ${pipelineRunId}`);
  console.log(`Started: ${startedAt.toISOString()}`);
  console.log(`========================================\n`);

  // Step 1: Determine since date
  let since: Date;
  try {
    const lastFetch = await getLastFetchTime();
    if (lastFetch) {
      since = lastFetch;
      console.log(`[Pipeline] Last fetch: ${since.toISOString()}`);
    } else {
      since = new Date(Date.now() - DEFAULT_LOOKBACK_HOURS * 60 * 60 * 1000);
      console.log(
        `[Pipeline] No previous fetch found, looking back ${DEFAULT_LOOKBACK_HOURS}h`
      );
    }
  } catch {
    // Database might not be set up yet — use default lookback
    since = new Date(Date.now() - DEFAULT_LOOKBACK_HOURS * 60 * 60 * 1000);
    console.log(
      `[Pipeline] Could not query last fetch time, looking back ${DEFAULT_LOOKBACK_HOURS}h`
    );
  }

  // Step 2: Fetch all sources
  const fetchResult = await fetchAllSources(since);

  if (fetchResult.totalFetched === 0 && fetchResult.failedSources === fetchResult.totalSources) {
    console.error("\n[Pipeline] ALL sources failed. Exiting with error.");
    process.exit(1);
  }

  // Step 3: Deduplicate
  console.log(`\n[Pipeline] Deduplicating ${fetchResult.totalFetched} items...`);
  const { unique, duplicatesRemoved } = deduplicateItems(fetchResult.items);
  console.log(
    `[Pipeline] Dedup: ${duplicatesRemoved} duplicates removed, ${unique.length} unique items`
  );

  // Step 4: Store in database
  let itemsStored = 0;
  try {
    if (unique.length > 0) {
      const { inserted } = await upsertItems(unique);
      itemsStored = inserted;
      console.log(`[Pipeline] Stored ${itemsStored} items in database`);
    } else {
      console.log("[Pipeline] No new items to store");
    }

    // Step 5: Log fetch results
    await logFetchRun(pipelineRunId, fetchResult.results);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`\n[Pipeline] Database error: ${msg}`);
    console.error(
      "[Pipeline] Items were fetched but could not be stored. Check DATABASE_URL."
    );
    process.exit(1);
  }

  // Step 6: Prune old data (keep Supabase under 500MB)
  try {
    const pruned = await pruneOldItems(90);
    if (pruned > 0) {
      console.log(`[Pipeline] Pruned ${pruned} items older than 90 days`);
    }
  } catch {
    console.warn("[Pipeline] Pruning failed (non-critical)");
  }

  // Summary
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  console.log(`\n========================================`);
  console.log(`Pipeline Complete: ${pipelineRunId}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Sources: ${fetchResult.totalSources} total, ${fetchResult.failedSources} failed`);
  console.log(`Fetched: ${fetchResult.totalFetched} items`);
  console.log(`Duplicates removed: ${duplicatesRemoved}`);
  console.log(`Stored: ${itemsStored} items`);
  console.log(`========================================\n`);
}

main().catch((error) => {
  console.error("[Pipeline] Fatal error:", error);
  process.exit(1);
});
