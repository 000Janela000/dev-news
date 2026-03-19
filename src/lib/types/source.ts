import type { Category, NewTrackedItem, SourceType } from "./schema";

export interface DataSource {
  name: string;
  type: SourceType;
  fetch(since: Date): Promise<NewTrackedItem[]>;
  isEnabled(): boolean;
}

export interface SourceConfig {
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  enabled: boolean;
  defaultCategory: Category;
}

export interface FetchResult {
  source: string;
  items: NewTrackedItem[];
  durationMs: number;
  error?: string;
}

export interface PipelineStats {
  pipelineRunId: string;
  startedAt: Date;
  completedAt: Date;
  sources: FetchResult[];
  totalFetched: number;
  duplicatesRemoved: number;
  itemsStored: number;
}
