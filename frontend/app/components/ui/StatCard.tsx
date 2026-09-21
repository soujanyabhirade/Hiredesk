"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: ReactNode;
}

export function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-shadow duration-150 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>
        {icon && (
          <div className="text-slate-400 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}
      </div>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
