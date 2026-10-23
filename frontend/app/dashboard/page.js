
"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5002/api";

const roleDetails = {
  ADMIN: {
    title: "Admin Workspace",
    subtitle: "Manage users, projects and platform activity.",
    color: "from-violet-600 to-indigo-600",
  },
  PROJECT_MANAGER: {
    title: "Project Manager Workspace",
    subtitle: "Organize projects, tasks and team members.",
    color: "from-blue-600 to-cyan-600",
  },
  TEAM_MEMBER: {
    title: "Team Member Workspace",
    subtitle: "Track your work and collaborate with your team.",
    color: "from-emerald-600 to-teal-600",
  },
  VIEWER: {
    title: "Viewer Workspace",
    subtitle: "Explore project progress and task information.",
    color: "from-orange-500 to-amber-600",
  },
};

const navigation = [
  {
    title: "Projects & Tasks",
    description: "Create projects, view tasks and track progress.",
    href: "/projects",
    icon: "📁",
  },
  {
    title: "Team Management",
    description: "View project members and manage team roles.",
    href: "/team",
    icon: "👥",
  },
  {
    title: "Task Discussions",
    description: "Read updates and discuss task progress.",
    href: "/comments",
    icon: "💬",
  },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href = "/";
      return;
    }

    const currentUser = JSON.parse(savedUser);
    setUser(currentUser);

    async function loadDashboard() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [projectResponse, taskResponse] = await Promise.all([
          fetch(`${API}/projects`, { headers }),
          fetch(`${API}/tasks`, { headers }),
        ]);

        if (
          projectResponse.status === 401 ||
          taskResponse.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
          return;
        }

        if (!projectResponse.ok || !taskResponse.ok) {
          throw new Error("Could not load dashboard data.");
        }

        setProjects(await projectResponse.json());
        setTasks(await taskResponse.json());
      } catch (err) {
        setError(err.message || "Unable to connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading workspace...
      </main>
    );
  }

  const details = roleDetails[user.role] || roleDetails.VIEWER;
  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-5 md:px-10">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-indigo-400">
            NEOSTATS
          </p>
          <h1 className="mt-1 text-xl font-bold">Project Hub</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-slate-400">
              {user.role.replaceAll("_", " ")}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10">
        <section
          className={`rounded-3xl bg-gradient-to-r ${details.color} p-8 md:p-10`}
        >
          <p className="text-sm font-semibold text-white/75">
            YOUR WORKSPACE
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            {details.title}
          </h2>
          <p className="mt-3 max-w-2xl text-white/85">
            Welcome, {user.name}. {details.subtitle}
          </p>
        </section>

        {error && (
          <p className="rounded-xl border border-red-900 bg-red-950/50 p-4 text-red-300">
            {error}
          </p>
        )}

        <section>
          <div className="mb-4">
            <h3 className="text-xl font-bold">Your Workspace</h3>
            <p className="mt-1 text-sm text-slate-400">
              Choose a section to continue working.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-indigo-500 hover:bg-slate-900/80"
              >
                <span className="text-3xl">{item.icon}</span>
                <h4 className="mt-4 font-bold group-hover:text-indigo-300">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-indigo-400">
                  Open section →
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Accessible Projects", value: projects.length, icon: "📁" },
            { label: "Total Tasks", value: tasks.length, icon: "📋" },
            { label: "Tasks Completed", value: completedTasks, icon: "✓" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{stat.label}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="mt-4 text-3xl font-bold">
                {loading ? "..." : stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">Your Projects</h3>

            {loading ? (
              <p className="mt-4 text-slate-400">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="mt-4 text-slate-400">No projects available yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <p className="font-semibold">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {project.description || "No description"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {project._count?.tasks ?? 0} tasks ·{" "}
                      {project._count?.members ?? 0} members
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">Recent Tasks</h3>

            {loading ? (
              <p className="mt-4 text-slate-400">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="mt-4 text-slate-400">No tasks available yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {task.project?.name || "Project"} ·{" "}
                      {task.status.replaceAll("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-5 text-xs text-slate-500">
              In progress: {inProgressTasks} · Completed: {completedTasks}
            </p>
          </div>
        </section>

        <footer className="border-t border-slate-800 py-5 text-center text-sm text-slate-500">
          NeoStats Collaborative Project Management Platform
        </footer>
      </div>
    </main>
  );
}
