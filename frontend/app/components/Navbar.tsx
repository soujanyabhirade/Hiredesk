"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authFetch, initializeAuth } from "@/lib/api-client";

export default function Navbar() {
  const [loggingOut, setLoggingOut] =
    useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initializeAuth()
      .then(() => authFetch("/api/auth/me", {
        cache: "no-store",
        skipAuthRefresh: true,
      }))
      .then((response) => response.ok ? response.json<{ role: string }>() : null)
      .then((user) => setIsAdmin(user?.role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await authFetch("/api/auth/logout", {
        method: "POST",
        skipAuthRefresh: true,
      });
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-bold text-blue-600"
        >
          HireDesk
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Dashboard
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Candidates
          </Link>

          <Link
            href="/jobs"
            className="text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Jobs
          </Link>

          <Link
            href="/interviews"
            className="text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Interviews
          </Link>

          <Link
            href="/feedback"
            className="text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Feedback
          </Link>

          {isAdmin && (
            <Link
              href="/users"
              className="text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              Users
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>
        </div>
      </div>
    </nav>
  );
}
