"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200",
        className,
      )}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-4 w-full bg-slate-200",
            index === lines - 1 && "w-3/4",
          )}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <SkeletonText lines={lines} />
    </div>
  );
}
