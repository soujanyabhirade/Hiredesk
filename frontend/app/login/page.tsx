"use client";

import { FormEvent, useEffect, useState } from "react";
import { authFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const message = new URLSearchParams(window.location.search).get("error");
      if (message) setGoogleError(message);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await authFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        skipAuthRefresh: true,
      });

      const data = await response.json<{ message?: string | string[] }>();

      if (!response.ok) {
        let message = data?.message || "Login failed.";

        if (Array.isArray(message)) {
          message = message.join(", ");
        }

        throw new Error(message);
      }

      window.location.replace("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Login failed. Please check your email and password.");
      }
    } finally {
      setLoading(false);
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
            Sign in to your account to continue
          </p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200/50">
          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}

          {googleError && (
            <Alert variant="error" className="mb-5">
              {googleError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <a
            href="/api/auth/google"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-1"
          >
            <svg
              viewBox="0 0 24 24"
              width={18}
              height={18}
              fill="none"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.88 10.13H22.8V10H12V14.41h6.29c-.27 1.3-.9 2.33-1.74 3.04l-.32.22-.01-.02c-.03.26-.07.51-.12.76.83.65 1.86 1.04 3.05 1.04 2.93 0 5.18-2.38 5.18-5.32 0-.34-.03-.67-.08-1.01.71-.51 1.31-1.18 1.71-1.98z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.69 0 4.95-2.05 5.58-4.84l-2.03-1.61c-.57.38-1.26.6-2.05.6-1.59 0-2.94-.84-3.75-2.12L8.08 16.7c-.29.23-.62.42-.97.57-.03.21-.07.42-.07.63 0 2.8 2.25 5.18 5.08 5.18z"
              />
              <path
                fill="#FBBC04"
                d="M5.86 14.27c-.14-.41-.22-.84-.22-1.27 0-.43.08-.86.22-1.27L5.86 11.1l-.01-.01H3.83c-.05.17-.07.35-.07.53 0 2.69 2.25 5.18 5.08 5.18z"
              />
              <path
                fill="#EA4335"
                d="M12 5.25c1.43 0 2.7.56 3.65 1.48l.02.02 2.85-2.85c-.02-.01-6.52-1.48-6.52-1.48S5.54 4.22 5.54 4.22l2.85 2.85C9.3 6.91 10.57 5.25 12 5.25z"
              />
            </svg>
            Sign in with Google
          </a>
        </div>
      </div>
    </main>
  );
}
