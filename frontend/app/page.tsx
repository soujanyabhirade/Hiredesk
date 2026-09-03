"use client";

import { FormEvent, useState } from "react";

type Candidate = {
  name: string;
  email: string;
  phone?: string;
  jobId: number;
};

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState("1");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    const candidate: Candidate = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      jobId: Number(jobId),
    };

    setCandidates((current) => [...current, candidate]);

    setName("");
    setEmail("");
    setPhone("");
    setJobId("1");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Candidates
          </h1>

          <p className="mt-2 text-slate-600">
            Manage candidates in your hiring pipeline.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Add Candidate
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Phone
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="jobId"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Job ID
                </label>

                <input
                  id="jobId"
                  type="number"
                  min="1"
                  value={jobId}
                  onChange={(event) => setJobId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
              >
                Add Candidate
              </button>
            </form>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                Candidate List
              </h2>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {candidates.length} candidate
                {candidates.length === 1 ? "" : "s"}
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center">
                <p className="font-medium text-slate-700">
                  No candidates yet.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add your first candidate using the form.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {candidates.map((candidate, index) => (
                  <article
                    key={`${candidate.email}-${index}`}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {candidate.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {candidate.email}
                        </p>

                        {candidate.phone && (
                          <p className="mt-1 text-sm text-slate-600">
                            {candidate.phone}
                          </p>
                        )}
                      </div>

                      <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        Job #{candidate.jobId}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
