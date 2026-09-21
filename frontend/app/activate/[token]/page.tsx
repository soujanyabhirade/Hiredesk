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
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-2 flex justify-center">
            <span className="text-3xl font-bold text-blue-600">H</span>
            <span className="text-3xl font-bold text-slate-900">
              ireDesk
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Set a password to activate your account
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}

          <form onSubmit={activate} className="space-y-5">
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              autoFocus
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Activating…" : "Activate Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
