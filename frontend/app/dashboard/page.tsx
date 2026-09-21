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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "COMPLETED"
      ? "green"
      : status === "CANCELLED"
        ? "red"
        : "blue";
  return (
    <Badge color={color as "green" | "red" | "blue"} className="w-fit">
      {status}
    </Badge>
  );
}

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
    <main className="min-h-screen w-full bg-canvas py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500">
            Overview of your recruitment pipeline, candidates, and upcoming
            activity.
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
                tone="blue"
              />

              <StatCard
                title="Total Jobs"
                value={stats.jobs}
                icon={<BriefcaseIcon />}
                tone="indigo"
              />

              <StatCard
                title="Open Jobs"
                value={stats.openJobs}
                icon={<BriefcaseIcon />}
                tone="emerald"
              />

              <StatCard
                title="Total Interviews"
                value={stats.interviews}
                icon={<CalendarIcon />}
                tone="cyan"
              />

              <StatCard
                title="Scheduled Interviews"
                value={stats.scheduledInterviews}
                icon={<ClockIcon />}
                tone="blue"
              />

              <StatCard
                title="Completed Interviews"
                value={stats.completedInterviews}
                icon={<CheckCircleIcon />}
                tone="emerald"
              />

              <StatCard
                title="Total Feedback"
                value={stats.feedback}
                icon={<StarIcon />}
                tone="amber"
              />
            </section>

            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Candidates
                  </h2>

                  <Link
                    href="/"
                    className="text-sm font-medium text-blue-600 transition-colors duration-150 hover:text-blue-700 hover:underline underline-offset-2"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5">
                  {stats.recentCandidates.length === 0 ? (
                    <EmptyState
                      title="No candidates yet"
                      description="Candidates will appear here once added."
                      icon={<UserIcon />}
                      tone="blue"
                    />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {stats.recentCandidates.map((candidate, i) => (
                        <li
                          key={candidate.id}
                          className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 transition-colors duration-150 hover:bg-slate-50/80 rounded-lg px-2 -mx-2"
                          style={{
                            animationDelay: `${i * 50}ms`,
                          }}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                            {getInitials(candidate.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {candidate.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {candidate.email}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              Added{" "}
                              {new Date(
                                candidate.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <Link href={`/candidates/${candidate.id}`}>
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Upcoming Interviews
                  </h2>

                  <Link
                    href="/interviews"
                    className="text-sm font-medium text-blue-600 transition-colors duration-150 hover:text-blue-700 hover:underline underline-offset-2"
                  >
                    View all →
                  </Link>
                </div>

                <div className="mt-5">
                  {stats.upcomingInterviews.length === 0 ? (
                    <EmptyState
                      title="No upcoming interviews"
                      description="Scheduled interviews will appear here."
                      icon={<CalendarIcon />}
                      tone="cyan"
                    />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {stats.upcomingInterviews.map((interview, i) => (
                        <li
                          key={interview.id}
                          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 transition-colors duration-150 hover:bg-slate-50/80 rounded-lg px-2 -mx-2"
                          style={{
                            animationDelay: `${i * 50}ms`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {interview.candidateName}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {interview.candidateEmail}
                              </p>
                            </div>
                            <StatusBadge status={interview.status} />
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {new Date(
                                  interview.scheduledAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {new Date(
                                  interview.scheduledAt,
                                ).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="pt-1">
                            <Link href={`/interviews/${interview.id}`}>
                              <Button variant="secondary" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">
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
