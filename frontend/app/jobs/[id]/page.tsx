"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

type Job = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  status: string;
};

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [job, setJob] =
    useState<Job | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [status, setStatus] =
    useState("OPEN");

  useEffect(() => {
    async function loadJob() {
      try {
        setError("");

        const response = await apiFetch(
          `/api/jobs/${id}`,
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load job.",
          );
        }

        const data: Job =
          await response.json();

        setJob(data);
        setTitle(data.title);
        setDescription(
          data.description ?? "",
        );
        setLocation(
          data.location ?? "",
        );
        setStatus(data.status);
      } catch {
        setError(
          "Could not load this job.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadJob();
    }
  }, [id]);

  function startEditing() {
    if (!job) {
      return;
    }

    setTitle(job.title);
    setDescription(
      job.description ?? "",
    );
    setLocation(
      job.location ?? "",
    );
    setStatus(job.status);

    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!job) {
      return;
    }

    setTitle(job.title);
    setDescription(
      job.description ?? "",
    );
    setLocation(
      job.location ?? "",
    );
    setStatus(job.status);

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");
      setSaving(true);

      const response =
        await apiFetch(`/api/jobs/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title,
              description,
              location,
              status,
            }),
          },
        );

      if (!response.ok) {
        throw new Error(
          "Failed to update job.",
        );
      }

      const updatedJob: Job =
        await response.json();

      setJob(updatedJob);
      setTitle(updatedJob.title);
      setDescription(
        updatedJob.description ?? "",
      );
      setLocation(
        updatedJob.location ?? "",
      );
      setStatus(updatedJob.status);

      setEditing(false);
      setSuccess(
        "Job updated successfully.",
      );
    } catch {
      setError(
        "Could not update this job.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!job) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${job.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setDeleting(true);

      const response =
        await apiFetch(`/api/jobs/${id}`, {
            method: "DELETE",
          });

      if (!response.ok) {
        let message =
          "Could not delete this job.";

        try {
          const data = await response.json<{ message?: string }>();

          if (
            typeof data.message ===
            "string"
          ) {
            message = data.message;
          }
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      router.push("/jobs");
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(error.message);
      } else {
        setError(
          "Could not delete this job.",
        );
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm">
          <p className="text-center text-slate-600">
            Loading job...
          </p>
        </div>
      </main>
    );
  }

  if (error && !job) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-red-50 p-6 text-red-600">
            {error}
          </div>

          <Link
            href="/jobs"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-slate-700">
              Job not found.
            </p>
          </div>

          <Link
            href="/jobs"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Jobs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/jobs"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Jobs
        </Link>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {!editing ? (
          <div className="mt-6 rounded-xl bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Job #{job.id}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {job.title}
                </h1>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                {job.status}
              </span>
            </div>

            <div className="mt-8 space-y-6">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </h2>

                <p className="mt-2 text-slate-700">
                  {job.description ||
                    "No description provided."}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </h2>

                <p className="mt-2 text-slate-700">
                  {job.location ||
                    "No location provided."}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </h2>

                <p className="mt-2 text-slate-700">
                  {job.status}
                </p>
              </section>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit Job
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Job"}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl bg-white p-8 shadow-sm"
          >
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Job #{job.id}
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Edit Job
              </h1>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Title
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Location
                </label>

                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                >
                  <option value="OPEN">
                    OPEN
                  </option>

                  <option value="CLOSED">
                    CLOSED
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}