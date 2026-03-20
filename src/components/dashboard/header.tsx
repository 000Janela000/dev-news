import Link from "next/link";
import { Activity, Sparkles } from "lucide-react";
import { HealthIndicator } from "./health-indicator";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Activity className="h-5 w-5 text-blue-500" />
          <span className="text-base font-semibold tracking-tight">DevNews</span>
        </Link>
        <div className="flex items-center gap-4">
          <HealthIndicator />
          <Link
            href="/digest"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Sparkles className="h-4 w-4" />
            <span>Weekly Digest</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
