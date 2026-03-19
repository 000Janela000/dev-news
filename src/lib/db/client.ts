import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required. See .env.example for setup instructions."
    );
  }
  return url;
}

// Lazy initialization to avoid connection errors at import time
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const client = postgres(getDatabaseUrl(), {
      prepare: false, // Required for Supabase Transaction pool mode
    });
    _db = drizzle({ client, schema });
  }
  return _db;
}
