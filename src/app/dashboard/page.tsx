import { Header } from "@/components/dashboard/header";
import { DashboardContent } from "./content";
import {
  getRecentItems,
  getRecentItemsExcludingRead,
} from "@/lib/db/queries";
import { getUser } from "@/lib/supabase/user";
import { selectBriefingItems } from "@/lib/briefing";
import { clusterItems } from "@/lib/clustering";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let items: Awaited<ReturnType<typeof getRecentItems>> = [];
  let dbError = false;

  try {
    let user = null;
    try {
      user = await getUser();
    } catch {
      // Auth not configured — continue without user
    }

    items = user
      ? await getRecentItemsExcludingRead(user.id, 200)
      : await getRecentItems(200);
  } catch {
    dbError = true;
  }

  const clustered = clusterItems(items);
  const { briefingItems, remainingItems, totalMinutes } =
    selectBriefingItems(clustered);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {dbError && (
          <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-400">
            Database not connected. Set <code>DATABASE_URL</code> and run{" "}
            <code>npm run db:push</code>.
          </div>
        )}
        <DashboardContent
          briefingItems={briefingItems}
          remainingItems={remainingItems}
          totalMinutes={totalMinutes}
        />
      </main>
    </div>
  );
}
