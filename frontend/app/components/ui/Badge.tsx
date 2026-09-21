"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeColor =
  | "blue"
  | "green"
  | "red"
  | "amber"
  | "slate"
  | "indigo";

interface BadgeProps {
  color?: BadgeColor;
  className?: string;
  children: ReactNode;
}

const badgeColors: Record<BadgeColor, string> = {
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  green: "bg-green-50 text-green-700 ring-1 ring-green-200/60",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  slate: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/60",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
};

export function Badge({
  color = "slate",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        badgeColors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
