"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";

type Job = {
  id: number;
  title: string;
  location?: string | null;
  status: string;
};

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobId: number;
  createdAt?: string;
  updatedAt?: string;
  job?: Job | null;
};

export default function CandidateDetailsPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(`/candidates/${candidateId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Candidate not found.");
          }

          if (response.status === 401) {
            throw new Error("You are not authenticated.");
          }

          throw new Error("Failed to load candidate.");
        }

        const data: Candidate = await response.json();

        setCandidate(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not load candidate.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (candidateId) {
      loadCandidate();
    }
  }, [candidateId]);

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <p className="text-slate-600">Loading candidate…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <h1 className="text-2xl font-bold text-slate-900">
              Unable to load candidate
            </h1>

            <Alert variant="error" className="mt-4">
              {error}
            </Alert>

            <Button
              variant="primary"
              href="/"
              className="mt-6"
            >
              Back to Candidates
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!candidate) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <p className="text-slate-600">Candidate not found.</p>

            <Button variant="primary" href="/" className="mt-6">
              Back to Candidates
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Button variant="ghost" size="sm" href="/">
          ← Back to Candidates
        </Button>

        <div className="mt-5 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Candidate Details
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {candidate.name}
              </h1>

              <p className="mt-2 text-slate-500">
                Candidate #{candidate.id}
              </p>
            </div>

            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-200/60">
              {candidate.job ? candidate.job.title : `Job #${candidate.jobId}`}
            </span>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Full Name
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {candidate.name}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Email
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {candidate.email}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Phone
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {candidate.phone || "Not provided"}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Applied Job
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {candidate.job ? candidate.job.title : `Job #${candidate.jobId}`}
              </p>

              {candidate.job?.location && (
                <p className="mt-1 text-sm text-slate-500">
                  {candidate.job.location}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Job Status
              </p>
              <p className="mt-2">
                {candidate.job ? (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      candidate.job.status.toLowerCase() === "open"
                        ? "bg-green-50 text-green-700 ring-1 ring-green-200/60"
                        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/60"
                    }`}
                  >
                    {candidate.job.status}
                  </span>
                ) : (
                  "Not available"
                )}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Candidate ID
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                #{candidate.id}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Job ID
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                #{candidate.jobId}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Created
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {candidate.createdAt
                  ? new Date(candidate.createdAt).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          </div>

          {candidate.job && (
            <div className="mt-8 rounded-lg bg-slate-50 p-6 ring-1 ring-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">
                Applied Job
              </h2>

              <p className="mt-2 text-slate-700">
                {candidate.job.title}
              </p>

              {candidate.job.location && (
                <p className="mt-1 text-sm text-slate-500">
                  Location: {candidate.job.location}
                </p>
              )}

              <Button
                variant="secondary"
                size="sm"
                href={`/jobs/${candidate.job.id}`}
                className="mt-4"
              >
                View Job Details →
              </Button>
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <Button variant="primary" href="/">
              Back to Candidates
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
