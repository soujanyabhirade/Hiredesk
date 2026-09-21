"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
}

const alertVariants: Record<AlertVariant, string> = {
  error:
    "border-red-200 bg-red-50 text-red-700",
  success:
    "border-green-200 bg-green-50 text-green-700",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700",
  info:
    "border-blue-200 bg-blue-50 text-blue-700",
};

export function Alert({
  variant = "info",
  className,
  children,
}: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        alertVariants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
