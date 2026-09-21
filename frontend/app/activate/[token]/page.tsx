"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

export default function ActivatePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function activate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await apiFetch("/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        skipAuthRefresh: true,
      });
      const data = await response.json<{ message?: string }>();
      if (!response.ok) throw new Error(data?.message || "Activation failed.");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex w-full flex-1 items-center justify-center bg-canvas px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-500/30">
            H
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Activate your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create a secure password to finish setting up your HireDesk account.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 sm:p-8">
          {error && (
            <div className="mb-6" role="alert">
              <Alert variant="error" className="rounded-lg">
                {error}
              </Alert>
            </div>
          )}

          <form
            onSubmit={activate}
            className="space-y-5"
            aria-label="Account activation"
          >
            <Input
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              autoFocus
              minLength={6}
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
              className="h-11 w-full text-base shadow-sm shadow-blue-600/20 transition-shadow duration-150 hover:shadow-md"
            >
              {saving ? "Activating…" : "Activate Account"}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
