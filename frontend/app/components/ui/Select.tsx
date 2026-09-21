"use client";

import { useId, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({
  label,
  className,
  id,
  children,
  ...props
}: SelectProps & { children: ReactNode }) {
  const generatedId = useId();
  const selectId = id ?? `select-${generatedId}`;

  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 pr-10 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
