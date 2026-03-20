"use client";

import { BriefingSection } from "@/components/dashboard/briefing-section";
import { MoreItemsSection } from "@/components/dashboard/more-items-section";
import type { ItemRow } from "@/lib/db";

interface DashboardContentProps {
  briefingItems: (ItemRow & { readingTimeMin: number })[];
  remainingItems: ItemRow[];
  totalMinutes: number;
}

export function DashboardContent({
  briefingItems,
  remainingItems,
  totalMinutes,
}: DashboardContentProps) {
  return (
    <>
      <BriefingSection items={briefingItems} totalMinutes={totalMinutes} />
      <MoreItemsSection items={remainingItems} />
    </>
  );
}
