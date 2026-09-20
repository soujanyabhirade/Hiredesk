"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobId: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function CandidateDetailsPage() {
  const params = useParams();

  const candidateId = params.id as string;

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `/candidates/${candidateId}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "Candidate not found.",
            );
          }

          if (response.status === 401) {
            throw new Error(
              "You are not authenticated.",
            );
          }

          throw new Error(
            "Failed to load candidate.",
          );
        }

        const data: Candidate =
          await response.json();

        setCandidate(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Could not load candidate.",
          );
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
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Loading candidate...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Unable to load candidate
            </h1>

            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Candidates
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!candidate) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Candidate not found.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Candidates
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Candidates
        </Link>

        <div className="mt-5 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Candidate Details
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                {candidate.name}
              </h1>

              <p className="mt-2 text-slate-600">
                Candidate #{candidate.id}
              </p>
            </div>

            <span className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              Job #{candidate.jobId}
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
                {candidate.phone ||
                  "Not provided"}
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
                Candidate ID
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                #{candidate.id}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-500">
                Created
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {candidate.createdAt
                  ? new Date(
                      candidate.createdAt,
                    ).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <Link
              href="/"
              className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Candidates
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}