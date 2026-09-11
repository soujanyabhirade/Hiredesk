"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Pagination } from "@/app/components/Pagination";

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
    const response = await apiFetch("/api/users", { cache: "no-store" });
    if (response.status === 401 || response.status === 403) {
      window.location.replace("/dashboard");
      return;
    }
    const data = await response.json();
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
      const response = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to provision user.");
      setUsers((current) => [...current, data.user]);
      setName("");
      setEmail("");
      setSuccess(data.message || "User provisioned successfully. An activation email has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to provision user.");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(user: User, changes: { role?: string; status?: string }) {
    setError("");
    try {
      const response = await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Failed to update user.");
      setUsers((current) => current.map((item) => item.id === user.id ? data : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">Back to Dashboard</Link>
        <header className="mb-8 mt-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">HireDesk</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">User Management</h1>
          <p className="mt-2 text-slate-600">Provision accounts and manage organization roles.</p>
        </header>

        {error && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Provision User</h2>
          <form onSubmit={provisionUser} className="grid gap-4 md:grid-cols-4">
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="rounded-lg border border-slate-300 px-3 py-2" />
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2" />
            <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              {provisionableRoles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Provisioning..." : "Provision User"}</button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Users</h2>
          {loading ? <p className="text-slate-600">Loading users...</p> : users.length === 0 ? <p className="text-slate-600">No users found.</p> : <div className="space-y-3">
            {visibleUsers.map((user) => <div key={user.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div><p className="font-semibold text-slate-900">{user.name || user.email}</p><p className="text-sm text-slate-600">{user.email}</p></div>
              <div className="flex flex-wrap gap-2"><select value={user.role} onChange={(event) => void updateUser(user, { role: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select><button onClick={() => void updateUser(user, { status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white">{user.status === "ACTIVE" ? "Deactivate" : "Activate"}</button><span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{user.status}</span></div>
            </div>)}
            <Pagination page={currentPage} totalPages={totalPages} total={users.length} itemLabel="user" onPageChange={setPage} />
          </div>}
        </section>
      </div>
    </main>
  );
}
