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
    <div className="mt-6 flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm">
      <div>
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {total} {itemLabel}
          {total === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
