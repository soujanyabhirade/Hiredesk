'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

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

  const [interview, setInterview] =
    useState<Interview | null>(null);

  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        setError('');

        const interviewResponse = await apiFetch(
          '/interviews',
        );

        if (!interviewResponse.ok) {
          const data = await interviewResponse.json<{ message?: string }>().catch(() => null);

          throw new Error(
            data?.message ||
              `Failed to load interviews (${interviewResponse.status})`,
          );
        }

        const interviews: Interview[] =
          await interviewResponse.json();

        const foundInterview =
          interviews.find(
            (item) => item.id === Number(id),
          );

        if (!foundInterview) {
          throw new Error(
            `Interview with id ${id} not found.`,
          );
        }

        setInterview(foundInterview);

        const candidateResponse = await apiFetch(
          '/candidates?limit=50',
        );

        if (candidateResponse.ok) {
          const candidateData: CandidatesResponse =
            await candidateResponse.json();

          const foundCandidate =
            candidateData.data.find(
              (item) =>
                item.id ===
                foundInterview.candidateId,
            );

          setCandidate(
            foundCandidate || null,
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load interview',
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
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
          Loading interview...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>

          <Link
            href="/interviews"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Back to Interviews
          </Link>
        </div>
      </main>
    );
  }

  if (!interview) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/interviews"
            className="text-blue-600 hover:underline"
          >
            ← Back to Interviews
          </Link>
        </div>

        <div className="rounded-xl bg-white p-8 shadow">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Interview #{interview.id}
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Interview Details
              </h1>
            </div>

            <span
              className={`inline-block w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                interview.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-700'
                  : interview.status ===
                      'CANCELLED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              {interview.status}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Candidate
              </h2>

              {candidate ? (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-lg font-semibold text-slate-900">
                    {candidate.name}
                  </p>

                  <p className="text-slate-600">
                    {candidate.email}
                  </p>

                  {candidate.phone && (
                    <p className="text-slate-600">
                      {candidate.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-600">
                  Candidate #{interview.candidateId}
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Scheduled Date & Time
              </h2>

              <p className="text-lg text-slate-900">
                {new Date(
                  interview.scheduledAt,
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Status
              </h2>

              <p className="text-lg text-slate-900">
                {interview.status}
              </p>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Candidate ID
              </h2>

              <p className="text-lg text-slate-900">
                {interview.candidateId}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
            <Link
              href="/interviews"
              className="rounded-lg bg-slate-200 px-5 py-2 font-medium text-slate-700 hover:bg-slate-300"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}