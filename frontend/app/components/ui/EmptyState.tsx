"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
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
  NonNullable<EmptyStateProps["tone"]>,
  { wrapper: string; icon: string }
> = {
  blue: {
    wrapper: "bg-blue-50 ring-1 ring-blue-100",
    icon: "text-blue-500",
  },
  indigo: {
    wrapper: "bg-indigo-50 ring-1 ring-indigo-100",
    icon: "text-indigo-500",
  },
  green: {
    wrapper: "bg-green-50 ring-1 ring-green-100",
    icon: "text-green-500",
  },
  amber: {
    wrapper: "bg-amber-50 ring-1 ring-amber-100",
    icon: "text-amber-500",
  },
  cyan: {
    wrapper: "bg-cyan-50 ring-1 ring-cyan-100",
    icon: "text-cyan-500",
  },
  emerald: {
    wrapper: "bg-emerald-50 ring-1 ring-emerald-100",
    icon: "text-emerald-500",
  },
  rose: {
    wrapper: "bg-rose-50 ring-1 ring-rose-100",
    icon: "text-rose-500",
  },
  slate: {
    wrapper: "bg-slate-50 ring-1 ring-slate-200/50",
    icon: "text-slate-400",
  },
};

export function EmptyState({
  title = "Nothing to show yet",
  description,
  icon,
  action,
  tone = "slate",
}: EmptyStateProps) {
  const styles = toneStyles[tone];

  return (
    <div className="rounded-xl bg-white px-8 py-12 text-center shadow-sm ring-1 ring-slate-200/50">
      {icon && (
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${styles.wrapper} ${styles.icon} [&>svg]:h-7 [&>svg]:w-7`}
        >
          {icon}
        </div>
      )}

      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>

      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}