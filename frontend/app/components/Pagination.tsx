"use client";

import { Button } from "@/app/components/ui/Button";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="mt-8 flex flex-col items-center gap-4 rounded-xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200/50 sm:flex-row sm:justify-between">
      <div>
        <p className="text-sm text-slate-500">
          Page{" "}
          <span className="font-semibold text-slate-900">{page}</span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">
            {totalPages}
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {total} {itemLabel}
          {total === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
