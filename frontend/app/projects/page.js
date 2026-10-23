
"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5002/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  async function loadProjects() {
    const response = await fetch(`${API}/projects`, {
      headers: authHeaders(),
    });

    if (!response.ok) throw new Error("Could not load projects.");

    setProjects(await response.json());
  }

  async function loadUsers() {
    const response = await fetch(`${API}/users`, {
      headers: authHeaders(),
    });

    if (response.ok) {
      setUsers(await response.json());
    }
  }

  async function loadTasks(projectId) {
    const response = await fetch(
      `${API}/tasks?projectId=${projectId}`,
      { headers: authHeaders() }
    );

    if (!response.ok) throw new Error("Could not load tasks.");

    setTasks(await response.json());
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedUser || !token) {
      window.location.href = "/";
      return;
    }

    setUser(JSON.parse(savedUser));

    Promise.all([loadProjects(), loadUsers()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createProject(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/projects`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          managerId: Number(managerId),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Project creation failed.");

      setProjectName("");
      setProjectDescription("");
      setManagerId("");
      setMessage("Project created successfully.");

      await loadProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openProject(project) {
    setSelectedProject(project);
    setError("");
    setMessage("");

    try {
      await loadTasks(project.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/tasks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          projectId: selectedProject.id,
          assignedToId: assignedToId ? Number(assignedToId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Task creation failed.");

      setTaskTitle("");
      setTaskDescription("");
      setAssignedToId("");
      setMessage("Task created successfully.");

      await loadTasks(selectedProject.id);
      await loadProjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(task, status) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/tasks/${task.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          status,
          version: task.version,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Task update failed.");

      setMessage("Task status updated.");
      await loadTasks(selectedProject.id);
    } catch (err) {
      setError(err.message);
    }
  }

  const canCreateProject = user?.role === "ADMIN";
  const canCreateTask =
    user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  if (!user) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-widest text-indigo-400">NEOSTATS</p>
            <h1 className="mt-2 text-3xl font-bold">Projects & Tasks</h1>
            <p className="mt-2 text-slate-400">
              Welcome, {user.name} · {user.role.replaceAll("_", " ")}
            </p>
          </div>

          <div className="flex gap-3">
            <a href="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">
              Dashboard
            </a>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-emerald-300">
            {message}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {canCreateProject && (
            <form onSubmit={createProject} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">Create Project</h2>

              <input
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-indigo-500"
              />

              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Project description"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-indigo-500"
                rows={3}
              />

              <select
                required
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
              >
                <option value="">Select project manager</option>
                {users.filter((u) => u.role === "PROJECT_MANAGER").map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>

              <button className="w-full rounded-xl bg-indigo-600 p-3 font-semibold hover:bg-indigo-500">
                Create Project
              </button>
            </form>
          )}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Available Projects</h2>

            {loading ? (
              <p className="mt-4 text-slate-400">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="mt-4 text-slate-400">No projects yet. Create one above.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => openProject(project)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedProject?.id === project.id
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-slate-800 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <span className="font-semibold">{project.name}</span>
                    <p className="mt-1 text-sm text-slate-400">
                      {project.description || "No description"}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Manager: {project.manager?.name || "Not specified"} ·{" "}
                      {project._count?.tasks ?? 0} tasks
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedProject && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
            <p className="mt-2 text-slate-400">Tasks in this project</p>

            {canCreateTask && (
              <form onSubmit={createTask} className="mt-5 grid gap-3 md:grid-cols-2">
                <input
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3"
                />

                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3"
                >
                  <option value="">Leave unassigned</option>
                  {users.filter((u) => u.isActive && u.role === "TEAM_MEMBER").map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>

                <input
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task description (optional)"
                  className="rounded-xl border border-slate-700 bg-slate-950 p-3"
                />

                <button className="rounded-xl bg-indigo-600 p-3 font-semibold hover:bg-indigo-500">
                  Create Task
                </button>
              </form>
            )}

            <div className="mt-6 space-y-3">
              {tasks.length === 0 ? (
                <p className="text-slate-400">No tasks in this project yet.</p>
              ) : (
                tasks.map((task) => {
                  const canUpdate =
                    user.role === "ADMIN" ||
                    (user.role === "PROJECT_MANAGER" &&
                      selectedProject.managerId === user.id) ||
                    (user.role === "TEAM_MEMBER" &&
                      task.assignedToId === user.id);

                  return (
                    <div key={task.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {task.description || "No description"} · Assigned to:{" "}
                          {task.assignedTo?.name || "Nobody"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Version {task.version}
                        </p>
                      </div>

                      {canUpdate ? (
                        <select
                          value={task.status}
                          onChange={(e) => updateStatus(task, e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-900 p-2"
                        >
                          <option value="TODO">To do</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-3 py-2 text-xs">
                          {task.status.replaceAll("_", " ")}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          NeoStats · Collaborative Project Management Platform
        </p>
      </div>
    </main>
  );
}
