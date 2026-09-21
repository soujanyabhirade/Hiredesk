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
import { CalendarIcon } from "@/app/components/ui/Icons";

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
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Interviews
          </h1>

          <p className="mt-2 text-slate-600">
            Schedule and manage candidate interviews.
          </p>
        </header>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {success && <Alert variant="success" className="mb-6">{success}</Alert>}

        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            {editingId !== null ? "Edit Interview" : "Schedule Interview"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="flex gap-3">
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
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50"
                >
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-48 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="No interviews found"
              description="Schedule your first interview using the form above."
            />
          ) : (
            <div className="space-y-4">
              {visibleInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {getCandidateName(interview.candidateId)}
                        </h3>
                        <Badge
                          color={getInterviewStatusColor(interview.status)}
                          className="w-fit"
                        >
                          {interview.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {getCandidateEmail(interview.candidateId)}
                      </p>

                      <p className="mt-3 text-sm text-slate-700">
                        <span className="font-medium">Scheduled:</span>{" "}
                        {new Date(interview.scheduledAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                </div>
              ))}

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
