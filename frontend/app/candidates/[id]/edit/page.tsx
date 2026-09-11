"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Job = {
  id: number;
  title: string;
};

type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobId: number;
};

type JobsResponse = {
  data: Job[];
};

export default function EditCandidatePage() {
  const params = useParams();
  const router = useRouter();

  const candidateId = params.id as string;

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const candidateResponse =
          await apiFetch(`/api/candidates/${candidateId}`);

        if (!candidateResponse.ok) {
          if (candidateResponse.status === 404) {
            throw new Error(
              "Candidate not found.",
            );
          }

          if (candidateResponse.status === 401) {
            throw new Error(
              "You are not authenticated. Please log in again.",
            );
          }

          throw new Error(
            "Failed to load candidate.",
          );
        }

        const candidateData: Candidate =
          await candidateResponse.json();

        const jobsResponse = await apiFetch(
          "/api/jobs?limit=50",
        );

        if (!jobsResponse.ok) {
          throw new Error(
            "Failed to load jobs.",
          );
        }

        const jobsData: JobsResponse =
          await jobsResponse.json();

        setCandidate(candidateData);
        setJobs(jobsData.data || []);

        setName(candidateData.name);
        setEmail(candidateData.email);
        setPhone(
          candidateData.phone || "",
        );
        setJobId(
          String(candidateData.jobId),
        );
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
      loadData();
    }
  }, [candidateId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch(
        `/api/candidates/${candidateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            jobId: Number(jobId),
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "You are not authenticated. Please log in again.",
          );
        }

        throw new Error(
          "Failed to update candidate.",
        );
      }

      router.push(
        `/candidates/${candidateId}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Could not update candidate.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Loading candidate...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !candidate) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Unable to load candidate
            </h1>

            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>

            <Link
              href={`/candidates/${candidateId}`}
              className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to Candidate
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/candidates/${candidateId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Candidate
        </Link>

        <div className="mt-5 rounded-xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Candidate
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Edit Candidate
          </h1>

          <p className="mt-2 text-slate-600">
            Update the candidate&apos;s information.
          </p>

          {error && (
            <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700"
              >
                Phone
              </label>

              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="job"
                className="block text-sm font-medium text-slate-700"
              >
                Applied Job
              </label>

              <select
                id="job"
                value={jobId}
                onChange={(event) =>
                  setJobId(event.target.value)
                }
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select a job
                </option>

                {jobs.map((job) => (
                  <option
                    key={job.id}
                    value={job.id}
                  >
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <Link
                href={`/candidates/${candidateId}`}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}