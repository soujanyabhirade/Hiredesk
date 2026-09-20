"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { apiFetch, authFetch } from "@/lib/api-client";

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
    authFetch("/api/auth/me", {
      cache: "no-store",
      skipAuthRefresh: true,
    })
      .then((response) => (response.ok ? response.json<{ role: string }>() : null))
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

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
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
            <button
              type="button"
              onClick={openCreateModal}
              disabled={creating}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "+ Post New Job"}
            </button>
          )}
        </header>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Search, Filter, and Sort */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search Jobs
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Title, description, location..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Filter by Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">
                  All Statuses
                </option>

                <option value="OPEN">
                  OPEN
                </option>

                <option value="CLOSED">
                  CLOSED
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sort"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort By
              </label>

              <select
                id="sort"
                value={sort}
                onChange={(event) => handleSortChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="titleAsc">
                  Title A–Z
                </option>

                <option value="titleDesc">
                  Title Z–A
                </option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-700">No jobs found.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <article key={job.id} className="rounded-xl bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {job.title}
                      </h2>

                      {job.description && (
                        <p className="mt-2 text-sm text-slate-600">{job.description}</p>
                      )}

                      {job.location && (
                        <p className="mt-3 text-sm text-slate-500">
                          📍 {job.location}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        job.status === "OPEN"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <p className="mt-4 text-xs text-slate-400">Job #{job.id}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View Details
                    </Link>

                    <Link
                      href={`/jobs/${job.id}`}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(job)}
                      disabled={deletingId === job.id}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === job.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm">
              <div>
                <p className="text-sm text-slate-500">
                  Page {page} of{" "}
                  {totalPages}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {total} job{total === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Post New Job</h2>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  {createSuccess}
                </div>
              )}

              <form onSubmit={handleCreateJob} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newJobTitle}
                    onChange={(event) => setNewJobTitle(event.target.value)}
                    required
                    maxLength={200}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    placeholder="e.g., Senior Frontend Engineer"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newJobDescription}
                    onChange={(event) => setNewJobDescription(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    placeholder="Job description, responsibilities, requirements..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={newJobLocation}
                    onChange={(event) => setNewJobLocation(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                    placeholder="e.g., Remote, New York, NY, or San Francisco, CA"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={creating || !newJobTitle.trim()}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? "Posting..." : "Post Job"}
                  </button>

                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={creating}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}