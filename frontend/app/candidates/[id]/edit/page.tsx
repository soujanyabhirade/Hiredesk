"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";

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

  const [candidate, setCandidate] = useState<Candidate | null>(null);

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

        const candidateResponse = await apiFetch(
          `/candidates/${candidateId}`,
        );

        if (!candidateResponse.ok) {
          if (candidateResponse.status === 404) {
            throw new Error("Candidate not found.");
          }

          if (candidateResponse.status === 401) {
            throw new Error("You are not authenticated. Please log in again.");
          }

          throw new Error("Failed to load candidate.");
        }

        const candidateData: Candidate = await candidateResponse.json();

        const jobsResponse = await apiFetch("/jobs?limit=50");

        if (!jobsResponse.ok) {
          throw new Error("Failed to load jobs.");
        }

        const jobsData: JobsResponse = await jobsResponse.json();

        setCandidate(candidateData);
        setJobs(jobsData.data || []);

        setName(candidateData.name);
        setEmail(candidateData.email);
        setPhone(candidateData.phone || "");
        setJobId(String(candidateData.jobId));
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
      loadData();
    }
  }, [candidateId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch(`/candidates/${candidateId}`, {
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
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        throw new Error("Failed to update candidate.");
      }

      router.push(`/candidates/${candidateId}`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not update candidate.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <p className="text-slate-600">Loading candidate…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !candidate) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <h1 className="text-2xl font-bold text-slate-900">
              Unable to load candidate
            </h1>

            <Alert variant="error" className="mt-4">
              {error}
            </Alert>

            <Button variant="primary" href={`/candidates/${candidateId}`} className="mt-6">
              Back to Candidate
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-2xl px-4">
        <Button variant="ghost" size="sm" href={`/candidates/${candidateId}`}>
          ← Back to Candidate
        </Button>

        <div className="mt-5 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Candidate
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Edit Candidate
          </h1>

          <p className="mt-2 text-slate-600">
            Update the candidate&apos;s information.
          </p>

          {error && <Alert variant="error" className="mt-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              id="name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Input
              id="phone"
              label="Phone"
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            <Select
              id="job"
              label="Applied Job"
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={saving}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                href={`/candidates/${candidateId}`}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
