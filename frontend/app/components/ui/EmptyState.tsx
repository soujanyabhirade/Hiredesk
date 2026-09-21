"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title = "Nothing to show yet",
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl bg-white px-8 py-12 text-center shadow-sm ring-1 ring-slate-200/50">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-slate-300 [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
