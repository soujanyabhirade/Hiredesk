"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/Pagination";
import { DocumentTextIcon, StarIcon } from "@/app/components/ui/Icons";

type Feedback = {
  id: number;
  interviewId: number;
  rating: number;
  comments?: string | null;
};

type Interview = {
  id: number;
  candidateId: number;
  scheduledAt: string;
  status: string;
};

type Candidate = {
  id: number;
  name: string;
  email: string;
};

const PAGE_SIZE = 10;

function RatingStars({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= rating;
    stars.push(
      <StarIcon
        key={i}
        className={
          filled ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-slate-300"
        }
      />,
    );
  }
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} of 5`}>
      {stars}
    </div>
  );
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const [interviewId, setInterviewId] = useState("");
  const [rating, setRating] = useState("5");
  const [comments, setComments] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(feedback.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleFeedback = feedback.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function loadFeedback() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/feedback", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to load feedback (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setFeedback(data as Feedback[]);
      setPage(1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load feedback.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadInterviews() {
    try {
      setLoadingInterviews(true);

      const response = await apiFetch("/interviews", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to load interviews (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setInterviews(data as Interview[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load interviews.",
      );
    } finally {
      setLoadingInterviews(false);
    }
  }

  async function loadCandidates() {
    try {
      const response = await apiFetch("/candidates?limit=50", {
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json<{ data: Candidate[] }>();

      setCandidates(data.data || []);
    } catch {
      // Candidate names are optional for displaying feedback.
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadFeedback();
      void loadInterviews();
      void loadCandidates();
    });
  }, []);

  function resetForm() {
    setInterviewId("");
    setRating("5");
    setComments("");
    setEditingId(null);
  }

  function getCandidateName(candidateId: number) {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    );

    return candidate ? candidate.name : `Candidate #${candidateId}`;
  }

  function getInterviewLabel(interview: Interview) {
    return `${getCandidateName(interview.candidateId)} — ${new Date(interview.scheduledAt).toLocaleString()}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!interviewId) {
      setError("Please select an interview.");
      return;
    }

    if (!rating) {
      setError("Please select a rating.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        interviewId: Number(interviewId),
        rating: Number(rating),
        comments: comments.trim(),
      };

      const response = await apiFetch(
        editingId !== null ? `/feedback/${editingId}` : "/feedback",
        {
          method: editingId !== null ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to ${editingId !== null ? "update" : "create"} feedback (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setSuccess(
        editingId !== null
          ? "Feedback updated successfully."
          : "Feedback created successfully.",
      );

      resetForm();

      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save feedback.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item: Feedback) {
    setEditingId(item.id);
    setInterviewId(String(item.interviewId));
    setRating(String(item.rating));
    setComments(item.comments || "");

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    resetForm();
    setError("");
    setSuccess("");
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this feedback?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await apiFetch(`/feedback/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }

      const data = await response.json<{ message?: string }>().catch(() => null);

      if (!response.ok) {
        let message =
          data?.message ||
          `Failed to delete feedback (${response.status})`;

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      setSuccess(
        data?.message || "Feedback deleted successfully.",
      );

      if (editingId === id) {
        resetForm();
      }

      await loadFeedback();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete feedback.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getRatingColor(rating: number) {
    if (rating >= 4) return "green";
    if (rating >= 3) return "amber";
    return "red";
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Feedback
          </h1>

          <p className="mt-2 text-slate-600">
            Review and manage feedback submitted for candidate
            interviews.
          </p>
        </header>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}
        {success && <Alert variant="success" className="mb-6">{success}</Alert>}

        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            {editingId !== null ? "Edit Feedback" : "Add Feedback"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Interview"
              value={interviewId}
              onChange={(event) => setInterviewId(event.target.value)}
              disabled={loadingInterviews}
            >
              <option value="">
                {loadingInterviews
                  ? "Loading interviews…"
                  : "Select an interview"}
              </option>
              {interviews.map((interview) => (
                <option key={interview.id} value={interview.id}>
                  Interview #{interview.id} —{" "}
                  {getInterviewLabel(interview)}
                </option>
              ))}
            </Select>

            <Select
              label="Rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            >
              <option value="1">1 / 5</option>
              <option value="2">2 / 5</option>
              <option value="3">3 / 5</option>
              <option value="4">4 / 5</option>
              <option value="5">5 / 5</option>
            </Select>

            <Textarea
              label="Comments"
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              rows={4}
              placeholder="Enter interview feedback..."
            />

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={saving || loadingInterviews}
                disabled={saving || loadingInterviews}
              >
                {saving
                  ? "Saving…"
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Feedback"}
              </Button>

              {editingId !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-semibold text-slate-900">
            Feedback List
          </h2>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50"
                >
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <EmptyState
              icon={<DocumentTextIcon />}
              title="No feedback found"
              description="Add feedback using the form above."
            />
          ) : (
            <div className="space-y-4">
              {visibleFeedback.map((item) => {
                const interview = interviews.find(
                  (interviewItem) =>
                    interviewItem.id === item.interviewId,
                );

                return (
                  <article
                    key={item.id}
                    className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Feedback #{item.id}
                          </h3>
                          <Badge color={getRatingColor(item.rating)} className="w-fit">
                            {item.rating}/5
                          </Badge>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          <span className="font-medium">Interview:</span>{" "}
                          #{item.interviewId}
                        </p>

                        {interview && (
                          <p className="mt-1 text-sm text-slate-600">
                            <span className="font-medium">Candidate:</span>{" "}
                            {getCandidateName(interview.candidateId)}
                          </p>
                        )}

                        <div className="mt-3">
                          <RatingStars rating={item.rating} />
                        </div>

                        {item.comments && (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                            {item.comments}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={deletingId === item.id}
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          {deletingId === item.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={feedback.length}
                itemLabel="feedback item"
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
