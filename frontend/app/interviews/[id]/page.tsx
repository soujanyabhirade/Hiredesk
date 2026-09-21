"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  jobId: number;
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

export default function InterviewDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        setError("");

        const interviewResponse = await apiFetch("/interviews");

        if (!interviewResponse.ok) {
          const data = await interviewResponse.json<{ message?: string }>().catch(() => null);

          throw new Error(
            data?.message ||
              `Failed to load interviews (${interviewResponse.status})`,
          );
        }

        const interviews: Interview[] = await interviewResponse.json();

        const foundInterview = interviews.find(
          (item) => item.id === Number(id),
        );

        if (!foundInterview) {
          throw new Error(`Interview with id ${id} not found.`);
        }

        setInterview(foundInterview);

        const candidateResponse = await apiFetch("/candidates?limit=50");

        if (candidateResponse.ok) {
          const candidateData: CandidatesResponse =
            await candidateResponse.json();

          const foundCandidate = candidateData.data.find(
            (item) => item.id === foundInterview.candidateId,
          );

          setCandidate(foundCandidate || null);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load interview",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadInterview();
    }
  }, [id]);

  function getInterviewStatusColor(interviewStatus: string) {
    if (interviewStatus === "COMPLETED") return "green";
    if (interviewStatus === "CANCELLED") return "red";
    return "blue";
  }

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
            <p className="text-slate-600">Loading interview…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <Alert variant="error" className="rounded-xl">
            {error}
          </Alert>

          <Button variant="ghost" size="sm" href="/interviews" className="mt-4">
            ← Back to Interviews
          </Button>
        </div>
      </main>
    );
  }

  if (!interview) {
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" href="/interviews">
            ← Back to Interviews
          </Button>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Interview #{interview.id}
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Interview Details
              </h1>
            </div>

            <Badge
              color={getInterviewStatusColor(interview.status)}
              className="w-fit"
            >
              {interview.status}
            </Badge>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Candidate
              </h2>

              {candidate ? (
                <div className="mt-2 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/50">
                  <p className="text-lg font-semibold text-slate-900">
                    {candidate.name}
                  </p>
                  <p className="text-slate-600">{candidate.email}</p>
                  {candidate.phone && (
                    <p className="text-slate-600">{candidate.phone}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-slate-600">
                  Candidate #{interview.candidateId}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Scheduled Date & Time
              </h2>
              <p className="mt-2 text-slate-900">
                {new Date(interview.scheduledAt).toLocaleString()}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Status
              </h2>
              <p className="mt-2 text-slate-900">{interview.status}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Candidate ID
              </h2>
              <p className="mt-2 text-slate-900">
                {interview.candidateId}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
            <Button variant="ghost" href="/interviews">
              Back
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
