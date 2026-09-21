"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, authFetch, initializeAuth } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/Pagination";
import { BriefcaseIcon } from "@/app/components/ui/Icons";

type Job = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  status: string;
};

type JobsResponse = {
  data: Job[];
  page: number;
  limit: number;
  search: string;
  status: string | null;
  sort: string;
  total: number;
};

type UserRole = "ADMIN" | "RECRUITER" | "INTERVIEWER" | "MENTOR" | "CANDIDATE";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [sort, setSort] = useState("newest");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("");

  const canCreateJob = userRole === "ADMIN" || userRole === "RECRUITER";

  useEffect(() => {
    initializeAuth()
      .then(() => authFetch("/api/auth/me", {
        cache: "no-store",
        skipAuthRefresh: true,
      }))
      .then((response) => response.ok ? response.json<{ role: string }>() : null)
      .then((user) => setUserRole((user?.role as UserRole) || null))
      .catch(() => setUserRole(null))
      .finally(() => setRoleLoading(false));
  }, []);

  const loadJobs = useCallback(async function loadJobs() {
    try {
      setError("");
      setLoading(true);

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(limit));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (status) {
        params.set("status", status);
      }

      if (sort) {
        params.set("sort", sort);
      }

      const response = await apiFetch(`/jobs?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        const data = await response.json<{ message?: string }>().catch(() => null);

        throw new Error(data?.message || "Failed to load jobs.");
      }

      const data: JobsResponse = await response.json();

      setJobs(data.data);
      setTotal(data.total);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not load jobs from the backend.");
      }
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, sort, status]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs();
    });
  }, [loadJobs]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setPage(1);
  }

  function handleSortChange(value: string) {
    setSort(value);
    setPage(1);
  }

  async function handleDelete(job: Job) {
    const confirmed = window.confirm(`Are you sure you want to delete "${job.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setDeletingId(job.id);

      const response = await apiFetch(`/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        let message = "Could not delete this job.";

        try {
          const data = await response.json<{ message?: string }>();

          if (typeof data.message === "string") {
            message = data.message;
          }

          if (Array.isArray(data.message)) {
            message = data.message.join(", ");
          }
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      await loadJobs();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not delete this job.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function openCreateModal() {
    setShowCreateModal(true);
    setCreateError("");
    setCreateSuccess("");
    setNewJobTitle("");
    setNewJobDescription("");
    setNewJobLocation("");
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setCreateError("");
    setCreateSuccess("");
    setNewJobTitle("");
    setNewJobDescription("");
    setNewJobLocation("");
  }

  async function handleCreateJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newJobTitle.trim()) {
      setCreateError("Job title is required.");
      return;
    }

    setCreateError("");
    setCreateSuccess("");
    setCreating(true);

    try {
      const response = await apiFetch("/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newJobTitle.trim(),
          description: newJobDescription.trim() || undefined,
          location: newJobLocation.trim() || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        if (response.status === 403) {
          throw new Error("You do not have permission to create jobs.");
        }

        const data = await response.json<{ message?: string | string[] }>().catch(() => null);

        let message = data?.message || "Failed to create job.";

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setCreateSuccess("Job posted successfully.");

      await loadJobs();

      setTimeout(() => {
        closeCreateModal();
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        setCreateError(error.message);
      } else {
        setCreateError("Could not create job.");
      }
    } finally {
      setCreating(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function getJobStatusColor(status: string) {
    if (status === "OPEN") return "green";
    if (status === "CLOSED") return "slate";
    return "slate";
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              HireDesk
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Jobs
            </h1>

            <p className="mt-2 text-slate-600">
              Manage open positions in your hiring pipeline.
            </p>
          </div>

          {canCreateJob && !roleLoading && (
            <Button
              variant="primary"
              onClick={openCreateModal}
              isLoading={creating}
              disabled={creating}
            >
              + Post New Job
            </Button>
          )}
        </header>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {/* Search, Filter, and Sort */}
        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="search"
              label="Search Jobs"
              placeholder="Title, description, location..."
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
            />

            <Select
              id="status"
              label="Filter by Status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </Select>

            <Select
              id="sort"
              label="Sort By"
              value={sort}
              onChange={(event) => handleSortChange(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="titleAsc">Title A–Z</option>
              <option value="titleDesc">Title Z–A</option>
            </Select>
          </div>
        </section>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: limit }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50"
              >
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon />}
            title="No jobs found"
            description="No jobs match your current search or filters."
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-shadow duration-150 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {job.title}
                      </h2>

                      {job.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {job.description}
                        </p>
                      )}

                      {job.location && (
                        <p className="mt-3 flex items-center text-sm text-slate-500">
                          <span className="mr-1" aria-hidden="true">
                            📍
                          </span>
                          {job.location}
                        </p>
                      )}
                    </div>

                    <Badge color={getJobStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Job #{job.id}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      href={`/jobs/${job.id}`}
                    >
                      View Details
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      href={`/jobs/${job.id}`}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={deletingId === job.id}
                      disabled={deletingId === job.id}
                      onClick={() => handleDelete(job)}
                    >
                      {deletingId === job.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                itemLabel="job"
                onPageChange={setPage}
              />
            </div>
          </>
        )}

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  Post New Job
                </h2>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
                >
                  <span aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      width={20}
                      height={20}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 5l14 14M19 5L5 19" />
                    </svg>
                  </span>
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {createError && (
                <Alert variant="error" className="mt-4">
                  {createError}
                </Alert>
              )}

              {createSuccess && (
                <Alert variant="success" className="mt-4">
                  {createSuccess}
                </Alert>
              )}

              <form onSubmit={handleCreateJob} className="mt-4 space-y-4">
                <Input
                  id="title"
                  label="Job Title"
                  required
                  maxLength={200}
                  placeholder="e.g., Senior Frontend Engineer"
                  value={newJobTitle}
                  onChange={(event) =>
                    setNewJobTitle(event.target.value)
                  }
                />

                <Textarea
                  id="description"
                  label="Description"
                  placeholder="Job description, responsibilities, requirements..."
                  value={newJobDescription}
                  onChange={(event) =>
                    setNewJobDescription(event.target.value)
                  }
                  rows={4}
                />

                <Input
                  id="location"
                  label="Location"
                  placeholder="e.g., Remote, New York, NY, or San Francisco, CA"
                  value={newJobLocation}
                  onChange={(event) =>
                    setNewJobLocation(event.target.value)
                  }
                />

                <div className="mt-6 flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={creating || !newJobTitle.trim()}
                    disabled={creating || !newJobTitle.trim()}
                    className="flex-1"
                  >
                    {creating ? "Posting…" : "Post Job"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeCreateModal}
                    disabled={creating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
