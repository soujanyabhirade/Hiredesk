"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/Pagination";
import { CardSkeleton } from "@/app/components/ui/Skeleton";
import { UserIcon, BriefcaseIcon } from "@/app/components/ui/Icons";

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobId: number;
  createdAt?: string;
  updatedAt?: string;
};

type Job = {
  id: number;
  title: string;
};

type CandidatesResponse = {
  data: Candidate[];
  page: number;
  limit: number;
  search: string;
  jobId: number | null;
  sort: string;
  total: number;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("");

  const [sort, setSort] = useState("newest");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCandidates = useCallback(async function loadCandidates() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        sort,
      });

      if (jobFilter) {
        params.set("jobId", jobFilter);
      }

      const response = await apiFetch(
        `/candidates?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        const data = await response.json<{ message?: string | string[] }>().catch(() => null);

        throw new Error(
          (data?.message as string) ||
            "Failed to load candidates.",
        );
      }

      const data: CandidatesResponse = await response.json();

      setCandidates(data.data);
      setTotal(data.total);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not load candidates.");
      }
    } finally {
      setLoading(false);
    }
  }, [jobFilter, limit, page, search, sort]);

  const loadJobs = useCallback(async function loadJobs() {
    try {
      setLoadingJobs(true);

      const response = await apiFetch("/jobs?limit=50", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        const data = await response.json<{ message?: string | string[] }>().catch(() => null);

        throw new Error(
          (data?.message as string) ||
            "Failed to load jobs.",
        );
      }

      const data = await response.json<JobsResponse>();

      setJobs(data.data || []);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not load jobs.");
      }
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCandidates();
    });
  }, [loadCandidates]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs();
    });
  }, [loadJobs]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          jobId: Number(jobId),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        const data = await response.json<{ message?: string | string[] }>().catch(() => null);

        let errorMessage =
          data?.message ||
          "Failed to create candidate.";

        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.join(", ");
        }

        throw new Error(errorMessage);
      }

      setName("");
      setEmail("");
      setPhone("");
      setJobId("");

      setSuccess("Candidate created successfully.");

      setPage(1);
      await loadCandidates();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not create candidate.");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this candidate?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await apiFetch(`/candidates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        const errorData = await response
          .json()
          .catch(() => null) as { message?: string | string[] } | null;

        let errorMessage =
          errorData?.message ||
          "Failed to delete candidate.";

        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage.join(", ");
        }

        throw new Error(errorMessage);
      }

      setSuccess("Candidate deleted successfully.");

      const remainingOnPage = candidates.length - 1;

      if (remainingOnPage === 0 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadCandidates();
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not delete candidate.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Candidates
          </h1>

          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500">
            Browse, search, and manage your recruitment pipeline.
          </p>
        </header>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {success && <Alert variant="success" className="mb-6">{success}</Alert>}

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <UserIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Add Candidate
            </h2>
          </div>

          <form onSubmit={handleCreate} className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            <Select
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              required
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>

            <Button
              type="submit"
              variant="primary"
              isLoading={creating || loadingJobs}
              disabled={creating || loadingJobs}
              className="md:col-span-2"
            >
              {creating ? "Creating…" : "Add Candidate"}
            </Button>
          </form>
        </section>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/50">
              <BriefcaseIcon className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Search &amp; Filters
            </h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />

            <Select
              value={jobFilter}
              onChange={(event) => {
                setJobFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>

            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
              <option value="email">Email A-Z</option>
              <option value="jobId">Job ID</option>
            </Select>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: limit }).map((_, index) => (
              <CardSkeleton key={index} lines={3} />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={<UserIcon className="h-7 w-7" />}
            title="No candidates found"
            description="Add a candidate using the form above or adjust your search filters."
            tone="blue"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                      {getInitials(candidate.name)}
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-slate-900">
                        {candidate.name}
                      </h2>
                      <p className="truncate text-sm text-slate-500">
                        {candidate.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/50">
                    <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400" />
                    Job #{candidate.jobId}
                  </span>

                  {candidate.phone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/50">
                      {candidate.phone}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    href={`/candidates/${candidate.id}`}
                  >
                    View Details
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    href={`/candidates/${candidate.id}/edit`}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={deletingId === candidate.id}
                    disabled={deletingId === candidate.id}
                    onClick={() => handleDelete(candidate.id)}
                  >
                    {deletingId === candidate.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && candidates.length > 0 && (
          <div className="mt-8">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              itemLabel="candidate"
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </main>
  );
}
