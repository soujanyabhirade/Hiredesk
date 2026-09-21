"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/Pagination";
import { CardSkeleton } from "@/app/components/ui/Skeleton";
import { CalendarIcon, ClockIcon } from "@/app/components/ui/Icons";

interface Candidate {
  id: number;
  name: string;
  email: string;
}

interface Interview {
  id: number;
  candidateId: number;
  scheduledAt: string;
  status: string;
}

interface CandidatesResponse {
  data: Candidate[];
  page: number;
  limit: number;
  total: number;
}

const PAGE_SIZE = 10;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [candidateId, setCandidateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("SCHEDULED");

  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(interviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleInterviews = interviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const loadInterviews = useCallback(async function loadInterviews() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      params.set("sort", sort);

      const response = await apiFetch(`/interviews?${params.toString()}`, {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to load interviews (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setInterviews(data as Interview[]);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load interviews",
      );
    } finally {
      setLoading(false);
    }
  }, [sort, statusFilter]);

  const loadCandidates = useCallback(async function loadCandidates() {
    try {
      setLoadingCandidates(true);

      const response = await apiFetch("/candidates?limit=50", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to load candidates (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      const candidatesData: CandidatesResponse = data as CandidatesResponse;

      setCandidates(candidatesData.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load candidates",
      );
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadInterviews();
    });
  }, [loadInterviews]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCandidates();
    });
  }, [loadCandidates]);

  function resetForm() {
    setCandidateId("");
    setScheduledAt("");
    setStatus("SCHEDULED");
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!candidateId) {
      setError("Please select a candidate.");
      return;
    }

    if (!scheduledAt) {
      setError("Please select a date and time.");
      return;
    }

    if (editingId !== null) {
      await handleUpdate(event);
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: Number(candidateId),
          scheduledAt: new Date(scheduledAt).toISOString(),
          status,
        }),
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to create interview (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setSuccess("Interview created successfully.");

      resetForm();

      await loadInterviews();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create interview",
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(interview: Interview) {
    setEditingId(interview.id);
    setCandidateId(String(interview.candidateId));
    setStatus(interview.status);

    const date = new Date(interview.scheduledAt);

    const localDateTime = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60 * 1000,
    )
      .toISOString()
      .slice(0, 16);

    setScheduledAt(localDateTime);

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    resetForm();
    setError("");
    setSuccess("");
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId === null) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(`/interviews/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: Number(candidateId),
          scheduledAt: new Date(scheduledAt).toISOString(),
          status,
        }),
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to update interview (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setSuccess("Interview updated successfully.");

      resetForm();

      await loadInterviews();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update interview",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this interview?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await apiFetch(`/interviews/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to delete interview (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setSuccess(data?.message || "Interview deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadInterviews();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete interview",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getCandidateName(candidateId: number) {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    );

    if (!candidate) {
      return `Candidate #${candidateId}`;
    }

    return candidate.name;
  }

  function getCandidateEmail(candidateId: number) {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    );

    return candidate?.email || "";
  }

  function getInterviewStatusColor(interviewStatus: string) {
    if (interviewStatus === "COMPLETED") return "green";
    if (interviewStatus === "CANCELLED") return "red";
    return "blue";
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Interviews
          </h1>

          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500">
            Schedule and manage candidate interviews.
          </p>
        </header>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {success && <Alert variant="success" className="mb-6">{success}</Alert>}

        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              {editingId !== null ? "Edit Interview" : "Schedule Interview"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <Select
              label="Candidate"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              disabled={loadingCandidates}
            >
              <option value="">
                {loadingCandidates
                  ? "Loading candidates…"
                  : "Select a candidate"}
              </option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} — {candidate.email}
                </option>
              ))}
            </Select>

            <Input
              type="datetime-local"
              label="Scheduled Date & Time"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />

            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <div className="flex gap-3 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={creating || saving}
                disabled={creating || saving || loadingCandidates}
              >
                {editingId !== null
                  ? saving
                    ? "Saving…"
                    : "Save Changes"
                  : creating
                    ? "Creating…"
                    : "Schedule Interview"}
              </Button>

              {editingId !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select
              label="Sort interviews"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest scheduled</option>
              <option value="oldest">Oldest scheduled</option>
              <option value="statusAsc">Status A–Z</option>
            </Select>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Interview List
          </h2>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: Math.min(PAGE_SIZE, 6) }).map((_, index) => (
                <CardSkeleton key={index} lines={3} />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="h-7 w-7" />}
              title="No interviews found"
              description="Schedule your first interview using the form above."
              tone="cyan"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-100">
                        {getInitials(getCandidateName(interview.candidateId))}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="truncate text-lg font-semibold text-slate-900">
                            {getCandidateName(interview.candidateId)}
                          </h3>
                          <Badge
                            color={getInterviewStatusColor(interview.status)}
                            className="shrink-0"
                          >
                            {interview.status}
                          </Badge>
                        </div>

                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          {getCandidateEmail(interview.candidateId)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <CalendarIcon className="h-4 w-4 text-cyan-500" />
                      <span>
                        {new Date(interview.scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <ClockIcon className="h-4 w-4 text-cyan-500" />
                      <span>
                        {new Date(interview.scheduledAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      href={`/interviews/${interview.id}`}
                    >
                      View Details
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEditing(interview)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={deletingId === interview.id}
                      disabled={deletingId === interview.id}
                      onClick={() => handleDelete(interview.id)}
                    >
                      {deletingId === interview.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && interviews.length > 0 && (
            <div className="mt-8">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={interviews.length}
                itemLabel="interview"
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
