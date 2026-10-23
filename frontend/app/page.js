
"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("admin@neostats.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5002/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Unable to connect to the backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-indigo-600 p-10 md:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-200">
              NEOSTATS HACKATHON
            </p>
            <h1 className="mt-8 text-4xl font-bold leading-tight">
              Manage work.
              <br />
              Move together.
            </h1>
            <p className="mt-5 leading-7 text-indigo-100">
              One collaborative workspace for projects, tasks, teams and
              discussions.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            Plan clearly. Collaborate efficiently.
          </p>
        </section>

        <section className="p-7 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-400">
              PROJECT MANAGEMENT PLATFORM
            </p>
            <h2 className="mt-3 text-3xl font-bold">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your workspace.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-semibold">Demo credentials</p>
            <p className="mt-2 text-sm text-slate-400">
              Admin: admin@neostats.com
            </p>
            <p className="text-sm text-slate-400">
              Password: Password123!
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Other demo roles: manager@neostats.com, member@neostats.com,
              viewer@neostats.com. They use the same demo password.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
