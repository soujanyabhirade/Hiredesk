"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/app/components/ui/Alert";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";
import { Badge } from "@/app/components/ui/Badge";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Pagination } from "@/app/components/Pagination";
import { UserIcon } from "@/app/components/ui/Icons";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

const roles = ["ADMIN", "RECRUITER", "INTERVIEWER", "MENTOR"];
const provisionableRoles = ["RECRUITER", "INTERVIEWER", "MENTOR"];
const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("RECRUITER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = users.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function loadUsers() {
    const response = await apiFetch("/users", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      window.location.replace("/dashboard");
      return;
    }
    const data = await response.json<User[] & { message?: string }>();
    if (!response.ok) throw new Error(data?.message || "Failed to load users.");
    setUsers(data);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadUsers().catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load users.");
      }).finally(() => setLoading(false));
    });
  }, []);

  async function provisionUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await response.json<{ user: User; message?: string }>();
      if (!response.ok) throw new Error(data?.message || "Failed to provision user.");
      setUsers((current) => [...current, data.user]);
      setName("");
      setEmail("");
      setSuccess(
        data.message ||
          "User provisioned successfully. An activation email has been sent.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to provision user.");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(
    user: User,
    changes: { role?: string; status?: string },
  ) {
    setError("");
    try {
      const response = await apiFetch(`/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await response.json<User & { message?: string }>();
      if (!response.ok) throw new Error(data?.message || "Failed to update user.");
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? data : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    }
  }

  function getStatusColor(status: string) {
    return status === "ACTIVE" ? "green" : "red";
  }

  return (
    <main className="min-h-screen w-full bg-canvas py-10">
      <div className="mx-auto max-w-5xl px-4">
        <Button variant="ghost" size="sm" href="/dashboard" className="mb-2">
          ← Back to Dashboard
        </Button>

        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            HireDesk
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            User Management
          </h1>

          <p className="mt-2 text-slate-600">
            Provision accounts and manage organization roles.
          </p>
        </header>

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}
        {success && (
          <Alert variant="success" className="mb-5">{success}</Alert>
        )}

        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Provision User
          </h2>

          <form onSubmit={provisionUser} className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {provisionableRoles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              disabled={saving}
            >
              {saving ? "Provisioning…" : "Provision User"}
            </Button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Users
          </h2>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-lg bg-slate-200"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<UserIcon />}
              title="No users found"
              description="Provision a user using the form above."
            />
          ) : (
            <div className="space-y-3">
              {visibleUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition-colors md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {user.name || user.email}
                    </p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      className="text-sm"
                      value={user.role}
                      onChange={(event) =>
                        void updateUser(user, { role: event.target.value })
                      }
                    >
                      {roles.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>

                    <Button
                      size="sm"
                      variant={user.status === "ACTIVE" ? "ghost" : "primary"}
                      onClick={() =>
                        void updateUser(user, {
                          status:
                            user.status === "ACTIVE"
                              ? "DISABLED"
                              : "ACTIVE",
                        })
                      }
                    >
                      {user.status === "ACTIVE"
                        ? "Deactivate"
                        : "Activate"}
                    </Button>

                    <Badge color={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              ))}

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={users.length}
                itemLabel="user"
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
