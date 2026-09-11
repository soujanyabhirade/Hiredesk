"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Activation failed.");
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6"><section className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-blue-600">HireDesk</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Activate Account</h1><p className="mt-2 text-slate-600">Set a password to activate your account.</p><form onSubmit={activate} className="mt-6 space-y-4"><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-lg border border-slate-300 px-3 py-2" />{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Activating..." : "Activate Account"}</button></form><Link href="/login" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Back to Login</Link></section></main>;
}
