'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from '@/lib/api-client';
import { Pagination } from '@/app/components/Pagination';

interface Candidate {
  id: number;
  name: string;
  email: string;
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

const PAGE_SIZE = 10;

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [candidateId, setCandidateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState('SCHEDULED');

  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');

  const [editingId, setEditingId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] =
    useState(true);

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(interviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleInterviews = interviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const loadInterviews = useCallback(async function loadInterviews() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (statusFilter) {
        params.set('status', statusFilter);
      }

      params.set('sort', sort);

      const response = await apiFetch(
        `/api/interviews?${params.toString()}`,
        {
          cache: 'no-store',
        },
      );

      if (response.status === 401) {
        window.location.replace('/login');
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to load interviews (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(', ');
        }

        throw new Error(message);
      }

      setInterviews(data as Interview[]);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load interviews',
      );
    } finally {
      setLoading(false);
    }
  }, [sort, statusFilter]);

  const loadCandidates = useCallback(async function loadCandidates() {
    try {
      setLoadingCandidates(true);

      const response = await apiFetch(
        '/api/candidates?limit=50',
        {
          cache: 'no-store',
        },
      );

      if (response.status === 401) {
        window.location.replace('/login');
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to load candidates (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(', ');
        }

        throw new Error(message);
      }

      const candidatesData: CandidatesResponse = data as CandidatesResponse;

      setCandidates(candidatesData.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load candidates',
      );
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadInterviews();
    });
  }, [loadInterviews]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCandidates();
    });
  }, [loadCandidates]);

  function resetForm() {
    setCandidateId('');
    setScheduledAt('');
    setStatus('SCHEDULED');
    setEditingId(null);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!candidateId) {
      setError('Please select a candidate.');
      return;
    }

    if (!scheduledAt) {
      setError('Please select a date and time.');
      return;
    }

    if (editingId !== null) {
      await handleUpdate(event);
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const response = await apiFetch('/api/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: Number(candidateId),
          scheduledAt: new Date(
            scheduledAt,
          ).toISOString(),
          status,
        }),
      });

      if (response.status === 401) {
        window.location.replace('/login');
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to create interview (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(', ');
        }

        throw new Error(message);
      }

      setSuccess('Interview created successfully.');

      resetForm();

      await loadInterviews();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create interview',
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(interview: Interview) {
    setEditingId(interview.id);
    setCandidateId(String(interview.candidateId));
    setStatus(interview.status);

    const date = new Date(interview.scheduledAt);

    const localDateTime = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60 * 1000,
    )
      .toISOString()
      .slice(0, 16);

    setScheduledAt(localDateTime);

    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEditing() {
    resetForm();
    setError('');
    setSuccess('');
  }

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (editingId === null) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await apiFetch(
        `/api/interviews/${editingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId: Number(candidateId),
            scheduledAt: new Date(
              scheduledAt,
            ).toISOString(),
            status,
          }),
        },
      );

      if (response.status === 401) {
        window.location.replace('/login');
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to update interview (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(', ');
        }

        throw new Error(message);
      }

      setSuccess('Interview updated successfully.');

      resetForm();

      await loadInterviews();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update interview',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this interview?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');

      const response = await apiFetch(
        `/api/interviews/${id}`,
        {
          method: 'DELETE',
        },
      );

      if (response.status === 401) {
        window.location.replace('/login');
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to delete interview (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(', ');
        }

        throw new Error(message);
      }

      setSuccess(
        data?.message ||
          'Interview deleted successfully.',
      );

      if (editingId === id) {
        resetForm();
      }

      await loadInterviews();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete interview',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getCandidateName(candidateId: number) {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    );

    if (!candidate) {
      return `Candidate #${candidateId}`;
    }

    return candidate.name;
  }

  function getCandidateEmail(candidateId: number) {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    );

    return candidate?.email || '';
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Interviews
        </h1>

        <p className="mb-8 text-slate-600">
          Schedule and manage candidate interviews.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {success}
          </div>
        )}

        <section className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            {editingId !== null
              ? 'Edit Interview'
              : 'Schedule Interview'}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Candidate
              </label>

              <select
                value={candidateId}
                onChange={(e) =>
                  setCandidateId(e.target.value)
                }
                disabled={loadingCandidates}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  {loadingCandidates
                    ? 'Loading candidates...'
                    : 'Select a candidate'}
                </option>

                {candidates.map((candidate) => (
                  <option
                    key={candidate.id}
                    value={candidate.id}
                  >
                    {candidate.name} — {candidate.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Scheduled Date & Time
              </label>

              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) =>
                  setScheduledAt(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="SCHEDULED">
                  Scheduled
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={
                  creating ||
                  saving ||
                  loadingCandidates
                }
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId !== null
                  ? saving
                    ? 'Saving...'
                    : 'Save Changes'
                  : creating
                    ? 'Creating...'
                    : 'Schedule Interview'}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg bg-slate-200 px-5 py-2 font-medium text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mb-6 rounded-xl bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Filter by status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">
                  All statuses
                </option>

                <option value="SCHEDULED">
                  Scheduled
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sort interviews
              </label>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="newest">
                  Newest scheduled
                </option>

                <option value="oldest">
                  Oldest scheduled
                </option>

                <option value="statusAsc">
                  Status A–Z
                </option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Interview List
          </h2>

          {loading ? (
            <div className="rounded-xl bg-white p-6 shadow">
              Loading interviews...
            </div>
          ) : interviews.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-slate-600 shadow">
              No interviews found.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-xl bg-white p-6 shadow"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {getCandidateName(
                          interview.candidateId,
                        )}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {getCandidateEmail(
                          interview.candidateId,
                        )}
                      </p>

                      <p className="mt-3 text-sm text-slate-700">
                        <span className="font-medium">
                          Scheduled:
                        </span>{' '}
                        {new Date(
                          interview.scheduledAt,
                        ).toLocaleString()}
                      </p>

                      <p className="mt-2">
                        <span className="text-sm font-medium text-slate-700">
                          Status:
                        </span>{' '}
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            interview.status ===
                            'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : interview.status ===
                                  'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {interview.status}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/interviews/${interview.id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        View Details
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(interview)
                        }
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(interview.id)
                        }
                        disabled={
                          deletingId === interview.id
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === interview.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <Pagination page={currentPage} totalPages={totalPages} total={interviews.length} itemLabel="interview" onPageChange={setPage} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}