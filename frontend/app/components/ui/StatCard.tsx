"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: ReactNode;
  tone?:
    | "blue"
    | "indigo"
    | "green"
    | "amber"
    | "cyan"
    | "emerald"
    | "rose"
    | "slate";
}

const toneStyles: Record<
  NonNullable<StatCardProps["tone"]>,
  { container: string; icon: string; value: string }
> = {
  blue: {
    container: "bg-blue-50 ring-1 ring-blue-100",
    icon: "text-blue-600",
    value: "text-blue-700",
  },
  indigo: {
    container: "bg-indigo-50 ring-1 ring-indigo-100",
    icon: "text-indigo-600",
    value: "text-indigo-700",
  },
  green: {
    container: "bg-green-50 ring-1 ring-green-100",
    icon: "text-green-600",
    value: "text-green-700",
  },
  amber: {
    container: "bg-amber-50 ring-1 ring-amber-100",
    icon: "text-amber-600",
    value: "text-amber-700",
  },
  cyan: {
    container: "bg-cyan-50 ring-1 ring-cyan-100",
    icon: "text-cyan-600",
    value: "text-cyan-700",
  },
  emerald: {
    container: "bg-emerald-50 ring-1 ring-emerald-100",
    icon: "text-emerald-600",
    value: "text-emerald-700",
  },
  rose: {
    container: "bg-rose-50 ring-1 ring-rose-100",
    icon: "text-rose-600",
    value: "text-rose-700",
  },
  slate: {
    container: "bg-slate-50 ring-1 ring-slate-200/50",
    icon: "text-slate-500",
    value: "text-slate-900",
  },
};

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  tone = "slate",
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg ${styles.container} ${styles.icon} [&>svg]:h-6 [&>svg]:w-6`}
          >
            {icon}
          </div>
        )}
      </div>

      <p className={`mt-3 text-3xl font-bold ${styles.value}`}>{value}</p>

      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}