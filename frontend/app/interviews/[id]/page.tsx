"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { CardSkeleton } from "@/app/components/ui/Skeleton";
import { ClockIcon, CalendarIcon } from "@/app/components/ui/Icons";

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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function InterviewDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function getInterviewStatusColor(interviewStatus: string) {
    if (interviewStatus === "COMPLETED") return "green";
    if (interviewStatus === "CANCELLED") return "red";
    return "blue";
  }

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

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
        <div className="mx-auto max-w-3xl px-4">
          <CardSkeleton lines={2} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} lines={2} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <h1 className="text-2xl font-bold text-slate-900">
              Unable to load interview
            </h1>

            <Alert variant="error" className="mt-4">
              {error}
            </Alert>

            <Button variant="primary" href="/interviews" className="mt-6">
              Back to Interviews
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!interview) {
    return (
      <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <h1 className="text-2xl font-bold text-slate-900">
              Interview not found
            </h1>

            <Button variant="primary" href="/interviews" className="mt-6">
              Back to Interviews
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Button variant="ghost" size="sm" href="/interviews">
          ← Back to Interviews
        </Button>

        <div className="mt-6 rounded-xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200/50">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Interview #{interview.id}
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
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

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50/70 p-5 ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">
                Candidate
              </p>
              {candidate ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    {getInitials(candidate.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {candidate.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {candidate.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 font-semibold text-slate-900">
                  Candidate #{interview.candidateId}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-slate-50/70 p-5 ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">
                Scheduled Date &amp; Time
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-cyan-500" />
                <p className="font-semibold text-slate-900">
                  {new Date(interview.scheduledAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-cyan-500" />
                <p className="font-semibold text-slate-900">
                  {new Date(interview.scheduledAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50/70 p-5 ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">
                Status
              </p>
              <p className="mt-2">
                <Badge
                  color={getInterviewStatusColor(interview.status)}
                  className="w-fit"
                >
                  {interview.status}
                </Badge>
              </p>
            </div>

            <div className="rounded-lg bg-slate-50/70 p-5 ring-1 ring-slate-200/50">
              <p className="text-sm font-medium text-slate-500">
                Candidate ID
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                #{interview.candidateId}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
            <Button variant="primary" href="/interviews">
              Back to Interviews
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
