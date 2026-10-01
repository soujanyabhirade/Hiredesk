"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { DocumentTextIcon } from "@/app/components/ui/Icons";

type ImportRowError = {
  row: number;
  message: string;
};

type ImportResult = {
  totalRows: number;
  imported: number;
  failed: number;
  errors: ImportRowError[];
};

type CandidatesCsvPanelProps = {
  search?: string;
  jobId?: string;
  onImported?: () => void | Promise<void>;
};

function filenameFromHeader(
  header?: string,
): string | null {
  if (!header) {
    return null;
  }

  const match = /filename="?([^";]+)"?/.exec(
    header,
  );

  return match?.[1] ?? null;
}

async function readErrorMessage(
  data: unknown,
  fallback: string,
): Promise<string> {
  const text =
    typeof Blob !== "undefined" &&
    data instanceof Blob
      ? await data.text()
      : typeof data === "string"
        ? data
        : "";

  if (!text) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text) as {
      message?: string | string[];
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(", ");
    }

    return parsed.message || fallback;
  } catch {
    return fallback;
  }
}

export default function CandidatesCsvPanel({
  search = "",
  jobId = "",
  onImported,
}: CandidatesCsvPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] =
    useState<ImportResult | null>(null);

  function handleFileChange() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const file = input.files?.[0];

    input.value = "";

    if (!file) {
      return;
    }

    void handleImport(file);
  }

  async function handleImport(file: File) {
    try {
      setImporting(true);
      setError("");
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/candidates/import",
        formData,
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      if (
        response.status < 200 ||
        response.status >= 300
      ) {
        throw new Error(
          await readErrorMessage(
            response.data,
            "Failed to import candidates.",
          ),
        );
      }

      setResult(response.data as ImportResult);

      await onImported?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not import candidates.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      setError("");

      const params: Record<string, string> = {};

      if (search) {
        params.search = search;
      }

      if (jobId) {
        params.jobId = jobId;
      }

      const response = await api.get(
        "/candidates/export",
        {
          params,
          responseType: "blob",
        },
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      if (
        response.status < 200 ||
        response.status >= 300
      ) {
        throw new Error(
          await readErrorMessage(
            response.data,
            "Failed to export candidates.",
          ),
        );
      }

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const filename =
        filenameFromHeader(
          response.headers[
            "content-disposition"
          ] as string | undefined,
        ) ?? "hiredesk-candidates.csv";

      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not export candidates.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <DocumentTextIcon className="h-5 w-5" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          Import &amp; Export CSV
        </h2>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        Columns: name, email, phone, jobId, jobTitle. Name and email
        are required, together with either jobId or jobTitle.
      </p>

      {error && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          variant="secondary"
          isLoading={importing}
          disabled={importing || exporting}
          onClick={() =>
            inputRef.current?.click()
          }
        >
          {importing
            ? "Importing…"
            : "Import CSV"}
        </Button>

        <Button
          variant="secondary"
          isLoading={exporting}
          disabled={exporting || importing}
          onClick={handleExport}
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {result && (
        <div className="mt-6">
          <Alert
            variant={result.failed > 0 ? "warning" : "success"}
          >
            {result.imported} of {result.totalRows} row
            {result.totalRows === 1 ? "" : "s"} imported
            successfully.
            {result.failed > 0 &&
              ` ${result.failed} row${
                result.failed === 1 ? "" : "s"
              } failed.`}
          </Alert>

          {result.errors.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200/50">
              {result.errors.map((rowError) => (
                <li
                  key={rowError.row}
                  className="px-4 py-2 text-sm text-slate-600"
                >
                  <span className="font-semibold text-slate-900">
                    Row {rowError.row}
                  </span>
                  {": "}
                  {rowError.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}