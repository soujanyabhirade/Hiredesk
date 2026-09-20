"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

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
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          "/dashboard",
          {
            cache: "no-store",
          },
        );

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
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
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
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            Loading dashboard...
          </div>
        ) : stats ? (
          <>
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Candidates"
                value={stats.candidates}
              />

              <StatCard
                title="Total Jobs"
                value={stats.jobs}
              />

              <StatCard
                title="Open Jobs"
                value={stats.openJobs}
              />

              <StatCard
                title="Total Interviews"
                value={stats.interviews}
              />

              <StatCard
                title="Scheduled Interviews"
                value={
                  stats.scheduledInterviews
                }
              />

              <StatCard
                title="Completed Interviews"
                value={
                  stats.completedInterviews
                }
              />

              <StatCard
                title="Total Feedback"
                value={stats.feedback}
              />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Recent Candidates
                  </h2>

                  <Link
                    href="/"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {stats.recentCandidates.length ===
                  0 ? (
                    <p className="text-sm text-slate-500">
                      No candidates found.
                    </p>
                  ) : (
                    stats.recentCandidates.map(
                      (candidate) => (
                        <div
                          key={candidate.id}
                          className="rounded-lg bg-slate-50 p-4"
                        >
                          <p className="font-semibold text-slate-900">
                            {candidate.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {candidate.email}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            Added{" "}
                            {new Date(
                              candidate.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Upcoming Interviews
                  </h2>

                  <Link
                    href="/interviews"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {stats.upcomingInterviews.length ===
                  0 ? (
                    <p className="text-sm text-slate-500">
                      No upcoming interviews.
                    </p>
                  ) : (
                    stats.upcomingInterviews.map(
                      (interview) => (
                        <div
                          key={interview.id}
                          className="rounded-lg bg-slate-50 p-4"
                        >
                          <p className="font-semibold text-slate-900">
                            {
                              interview.candidateName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {
                              interview.candidateEmail
                            }
                          </p>

                          <p className="mt-2 text-sm text-slate-700">
                            {new Date(
                              interview.scheduledAt,
                            ).toLocaleString()}
                          </p>

                          <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {interview.status}
                          </span>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Quick Actions
              </h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Candidates
                </Link>

                <Link
                  href="/jobs"
                  className="rounded-lg bg-slate-800 px-5 py-2 font-medium text-white hover:bg-slate-900"
                >
                  Jobs
                </Link>

                <Link
                  href="/interviews"
                  className="rounded-lg bg-slate-800 px-5 py-2 font-medium text-white hover:bg-slate-900"
                >
                  Interviews
                </Link>

                <Link
                  href="/feedback"
                  className="rounded-lg bg-slate-800 px-5 py-2 font-medium text-white hover:bg-slate-900"
                >
                  Feedback
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
