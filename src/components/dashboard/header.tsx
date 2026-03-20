"use client";

import Link from "next/link";
import { Zap, Sparkles, Search } from "lucide-react";
import { useState } from "react";
import { HealthIndicator } from "./health-indicator";
import { UserMenu } from "./user-menu";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          <Zap className="size-4 text-yellow-400" />
          <span className="text-sm font-semibold tracking-tight">DevNews</span>
        </Link>

        <div className="flex items-center gap-1">
          <HealthIndicator />

          {searchOpen ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim().length >= 2) {
                  setSearchOpen(false);
                }
              }}
              className="flex items-center"
            >
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setSearchOpen(false)}
                placeholder="Search..."
                className="h-7 w-36 rounded-md border border-border bg-muted/50 px-2 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-muted-foreground/30"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              <Search className="size-3.5" />
            </button>
          )}

          <Link
            href="/digest"
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            title="Weekly Digest"
          >
            <Sparkles className="size-3.5" />
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
