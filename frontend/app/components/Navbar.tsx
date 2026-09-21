"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authFetch, initializeAuth } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Candidates", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Interviews", href: "/interviews" },
  { label: "Feedback", href: "/feedback" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeAuth()
      .then(() =>
        authFetch("/api/auth/me", {
          cache: "no-store",
          skipAuthRefresh: true,
        }),
      )
      .then((response) =>
        response.ok
          ? response.json<{ role: string; name?: string }>()
          : null,
      )
      .then((user) => {
        setIsAdmin(user?.role === "ADMIN");
        setReady(true);
      })
      .catch(() => {
        setIsAdmin(false);
        setReady(true);
      });
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-xl font-bold text-slate-950 transition-colors duration-150 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          HireDesk
        </Link>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-4 py-2 text-sm font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  active &&
                    "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 hover:text-blue-800",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-blue-600" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/users"
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive("/users") &&
                  "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 hover:text-blue-800",
              )}
            >
              Users
              {isActive("/users") && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-blue-600" />
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut || !ready}
            className="ml-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </nav>
  );
}
