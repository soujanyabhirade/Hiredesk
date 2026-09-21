"use client";

import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Select } from "@/app/components/ui/Select";
import { Badge } from "@/app/components/ui/Badge";

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

  const [job, setJob] = useState<Job | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [location, setLocation] = useState("");

  const [status, setStatus] = useState("OPEN");

  useEffect(() => {
    async function loadJob() {
      try {
        setError("");

        const response = await apiFetch(`/jobs/${id}`);

        if (!response.ok) {
          throw new Error("Failed to load job.");
        }

        const data: Job = await response.json();

        setJob(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setLocation(data.location ?? "");
        setStatus(data.status);
      } catch {
        setError("Could not load this job.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadJob();
    }
  }, [id]);

  function startEditing() {
    if (!job) return;

    setTitle(job.title);
    setDescription(job.description ?? "");
    setLocation(job.location ?? "");
    setStatus(job.status);

    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!job) return;

    setTitle(job.title);
    setDescription(job.description ?? "");
    setLocation(job.location ?? "");
    setStatus(job.status);

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");
      setSaving(true);

      const response = await apiFetch(`/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          location,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update job.");
      }

      const updatedJob: Job = await response.json();

      setJob(updatedJob);
      setTitle(updatedJob.title);
      setDescription(updatedJob.description ?? "");
      setLocation(updatedJob.location ?? "");
      setStatus(updatedJob.status);

      setEditing(false);
      setSuccess("Job updated successfully.");
    } catch {
      setError("Could not update this job.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!job) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${job.title}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setDeleting(true);

      const response = await apiFetch(`/jobs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "Could not delete this job.";

        try {
          const data = await response.json<{ message?: string }>();

          if (typeof data.message === "string") {
            message = data.message;
          }
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      router.push("/jobs");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not delete this job.");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <p className="text-center text-slate-600">
              Loading job…
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !job) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <Alert variant="error" className="rounded-xl">
            {error}
          </Alert>

          <Button variant="ghost" size="sm" href="/jobs" className="mt-4">
            ← Back to Jobs
          </Button>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen w-full bg-canvas py-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
            <p className="text-slate-700">Job not found.</p>
          </div>

          <Button variant="ghost" size="sm" href="/jobs" className="mt-4">
            ← Back to Jobs
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Button variant="ghost" size="sm" href="/jobs">
          ← Back to Jobs
        </Button>

        {error && <Alert variant="error" className="mt-6">{error}</Alert>}
        {success && <Alert variant="success" className="mt-6">{success}</Alert>}

        {!editing ? (
          <div className="mt-6 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Job #{job.id}
                </p>

                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {job.title}
                </h1>
              </div>

              <Badge
                color={job.status === "OPEN" ? "green" : "slate"}
                className="w-fit"
              >
                {job.status}
              </Badge>
            </div>

            <div className="mt-8 space-y-6">
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </h2>
                <p className="mt-2 text-slate-700">
                  {job.description || "No description provided."}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </h2>
                <p className="mt-2 text-slate-700">
                  {job.location || "No location provided."}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </h2>
                <p className="mt-2 text-slate-700">{job.status}</p>
              </section>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
              <Button variant="primary" onClick={startEditing}>
                Edit Job
              </Button>

              <Button
                variant="danger"
                isLoading={deleting}
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting…" : "Delete Job"}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50"
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
              <Input
                id="title"
                label="Title"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />

              <Textarea
                id="description"
                label="Description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />

              <Input
                id="location"
                label="Location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />

              <Select
                id="status"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </Select>
            </div>

            <div className="mt-8 flex gap-3">
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
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
