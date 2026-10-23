"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Server } from "lucide-react";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5002/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hackathon Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Full-stack application powered by Next.js, Express and PostgreSQL
            </p>
          </div>

          <button
            onClick={loadUsers}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-200"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="text-blue-400" />
              <h2 className="font-semibold">Users</h2>
            </div>

            <p className="text-3xl font-bold">{users.length}</p>
            <p className="mt-1 text-sm text-slate-400">
              Registered users
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Server className="text-green-400" />
              <h2 className="font-semibold">Backend</h2>
            </div>

            <p className="font-semibold text-green-400">Connected</p>
            <p className="mt-1 text-sm text-slate-400">
              Express API
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4">
              <h2 className="font-semibold">Database</h2>
            </div>

            <p className="font-semibold text-green-400">PostgreSQL</p>
            <p className="mt-1 text-sm text-slate-400">
              Prisma ORM
            </p>
          </div>

        </section>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">Users</h2>

          {loading ? (
            <p className="text-slate-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-slate-400">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-800 text-sm text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-800"
                    >
                      <td className="px-4 py-3">{user.id}</td>
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {user.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}