export { getDb } from "./client";
export { items, fetchLogs } from "./schema";
export type { ItemRow, NewItemRow, FetchLogRow } from "./schema";
export { normalizeItemUrl, isTitleDuplicate, deduplicateItems } from "./dedup";
export { upsertItems, logFetchRun, getLastFetchTime } from "./mutations";
export {
  getItemsByCategory,
  getItemsByDateRange,
  getItemsBySource,
  searchItems,
  getUnsummarizedItems,
  getRecentItems,
  getItemById,
  getItemCounts,
} from "./queries";
