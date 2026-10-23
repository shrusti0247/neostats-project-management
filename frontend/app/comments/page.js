
"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5002/api";

export default function CommentsPage() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser || !localStorage.getItem("token")) {
      window.location.href = "/";
      return;
    }

    setUser(JSON.parse(savedUser));

    async function loadProjects() {
      try {
        const response = await fetch(`${API}/projects`, {
          headers: headers(),
        });

        if (!response.ok) throw new Error("Unable to load projects.");

        setProjects(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  async function loadTasks(id) {
    setProjectId(id);
    setTaskId("");
    setTasks([]);
    setComments([]);
    setError("");
    setMessage("");

    if (!id) return;

    try {
      const response = await fetch(`${API}/tasks?projectId=${id}`, {
        headers: headers(),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to load tasks.");

      setTasks(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadComments(id) {
    setTaskId(id);
    setComments([]);
    setError("");
    setMessage("");

    if (!id) return;

    try {
      const response = await fetch(`${API}/comments/task/${id}`, {
        headers: headers(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load comments.");
      }

      setComments(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/comments`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          taskId: Number(taskId),
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add comment.");
      }

      setContent("");
      setMessage("Comment added successfully.");
      await loadComments(taskId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/comments/${commentId}`, {
        method: "DELETE",
        headers: headers(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete comment.");
      }

      setMessage("Comment deleted.");
      await loadComments(taskId);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading...</main>;
  }

  const canComment = user.role !== "VIEWER";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold tracking-widest text-indigo-400">NEOSTATS</p>
            <h1 className="mt-2 text-3xl font-bold">Task Discussions</h1>
            <p className="mt-2 text-slate-400">
              Share updates and collaborate with your team.
            </p>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Back to Dashboard
          </a>
        </header>

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

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label className="block text-sm text-slate-400">Select project</label>
          <select
            value={projectId}
            onChange={(event) => loadTasks(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          >
            <option value="">Choose a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <label className="mt-5 block text-sm text-slate-400">Select task</label>
          <select
            value={taskId}
            onChange={(event) => loadComments(event.target.value)}
            disabled={!projectId}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          >
            <option value="">Choose a task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </section>

        {taskId && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Discussion</h2>

            {canComment && (
              <form onSubmit={addComment} className="mt-5 space-y-3">
                <textarea
                  required
                  maxLength={2000}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write a task update or comment..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-indigo-500"
                />
                <button className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500">
                  Post Comment
                </button>
              </form>
            )}

            {!canComment && (
              <p className="mt-3 text-sm text-slate-400">
                Viewer access is read-only.
              </p>
            )}

            <div className="mt-6 space-y-3">
              {comments.length === 0 ? (
                <p className="text-slate-400">No comments on this task yet.</p>
              ) : (
                comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {comment.author?.name || "Team member"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString()
                            : ""}
                        </p>
                      </div>

                      {(user.role === "ADMIN" ||
                        comment.authorId === user.id) && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-sm text-red-300 hover:text-red-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-slate-300">
                      {comment.content}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          NeoStats Collaborative Project Management Platform
        </p>
      </div>
    </main>
  );
}
