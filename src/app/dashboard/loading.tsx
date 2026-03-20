import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex gap-3">
                <Skeleton className="mt-1.5 size-1.5 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-1 h-3 w-2/3" />
                  <Skeleton className="mt-2 h-2.5 w-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
