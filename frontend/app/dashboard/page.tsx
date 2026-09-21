"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { StatCard } from "@/app/components/ui/StatCard";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import {
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@/app/components/ui/Icons";

type DashboardStats = {
  candidates: number;
  jobs: number;
  openJobs: number;
  interviews: number;
  scheduledInterviews: number;
  completedInterviews: number;
  feedback: number;

  recentCandidates: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  }[];

  upcomingInterviews: {
    id: number;
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    scheduledAt: string;
    status: string;
  }[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/dashboard", {
          cache: "no-store",
        });

        const data: DashboardStats & { message?: string } =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to load dashboard (${response.status})`,
          );
        }

        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Overview of your recruitment activity.
          </p>
        </header>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 h-8 w-12 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Candidates"
                value={stats.candidates}
                icon={<UserIcon />}
              />

              <StatCard
                title="Total Jobs"
                value={stats.jobs}
                icon={<BriefcaseIcon />}
              />

              <StatCard
                title="Open Jobs"
                value={stats.openJobs}
                icon={<BriefcaseIcon />}
              />

              <StatCard
                title="Total Interviews"
                value={stats.interviews}
                icon={<CalendarIcon />}
              />

              <StatCard
                title="Scheduled Interviews"
                value={stats.scheduledInterviews}
                icon={<ClockIcon />}
              />

              <StatCard
                title="Completed Interviews"
                value={stats.completedInterviews}
                icon={<CheckCircleIcon />}
              />

              <StatCard
                title="Total Feedback"
                value={stats.feedback}
                icon={<StarIcon />}
              />
            </section>

            <section className="mt-10 grid gap-8 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Recent Candidates
                  </h2>

                  <Link
                    href="/"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {stats.recentCandidates.length === 0 ? (
                    <EmptyState
                      title="No recent candidates"
                      description="Candidates will appear here once added."
                    />
                  ) : (
                    stats.recentCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/50"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {candidate.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {candidate.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Added{" "}
                            {new Date(candidate.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <Link href={`/candidates/${candidate.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Upcoming Interviews
                  </h2>

                  <Link
                    href="/interviews"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {stats.upcomingInterviews.length === 0 ? (
                    <EmptyState
                      title="No upcoming interviews"
                      description="Scheduled interviews will appear here."
                    />
                  ) : (
                    stats.upcomingInterviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/50"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {interview.candidateName}
                            </p>
                            <p className="text-sm text-slate-600">
                              {interview.candidateEmail}
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                              <span className="font-medium">
                                Scheduled:
                              </span>{" "}
                              {new Date(interview.scheduledAt).toLocaleString()}
                            </p>
                          </div>

                          <Badge
                            color={
                              interview.status === "COMPLETED"
                                ? "green"
                                : interview.status === "CANCELLED"
                                  ? "red"
                                  : "blue"
                            }
                            className="w-fit"
                          >
                            {interview.status}
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <Link href={`/interviews/${interview.id}`}>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
              <h2 className="text-xl font-semibold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="primary" href="/">
                  Candidates
                </Button>

                <Button variant="primary" href="/jobs">
                  Jobs
                </Button>

                <Button variant="primary" href="/interviews">
                  Interviews
                </Button>

                <Button variant="primary" href="/feedback">
                  Feedback
                </Button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
