
"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5002/api";

export default function TeamPage() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState("TEAM_MEMBER");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

    const currentUser = JSON.parse(savedUser);
    setUser(currentUser);

    async function loadData() {
      try {
        const projectResponse = await fetch(`${API}/projects`, {
          headers: headers(),
        });

        if (!projectResponse.ok) {
          throw new Error("Unable to load projects.");
        }

        setProjects(await projectResponse.json());

        // Only Admins can use the users listing endpoint.
        if (currentUser.role === "ADMIN") {
          const userResponse = await fetch(`${API}/users`, {
            headers: headers(),
          });

          if (userResponse.ok) {
            setUsers(await userResponse.json());
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function loadMembers(id) {
    setProjectId(id);
    setMembers([]);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/team/${id}`, {
        headers: headers(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load team members.");
      }

      setMembers(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addMember(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API}/team/${projectId}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          userId: Number(memberId),
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add team member.");
      }

      setMessage("Team member added or updated successfully.");
      setMemberId("");
      await loadMembers(projectId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeRole(userId, newRole) {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/team/${projectId}/${userId}`,
        {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to change role.");
      }

      setMessage("Member role updated.");
      await loadMembers(projectId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMember(userId) {
    if (!window.confirm("Remove this member from the project?")) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/team/${projectId}/${userId}`,
        {
          method: "DELETE",
          headers: headers(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to remove member.");
      }

      setMessage("Member removed from project.");
      await loadMembers(projectId);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading...</main>;
  }

  const canManageTeam =
    user.role === "ADMIN" || user.role === "PROJECT_MANAGER";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold tracking-widest text-indigo-400">NEOSTATS</p>
            <h1 className="mt-2 text-3xl font-bold">Team Management</h1>
            <p className="mt-2 text-slate-400">
              Manage project membership and collaboration.
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
          <h2 className="text-lg font-bold">Select a project</h2>

          {loading ? (
            <p className="mt-4 text-slate-400">Loading projects...</p>
          ) : (
            <select
              value={projectId}
              onChange={(event) => loadMembers(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 md:max-w-xl"
            >
              <option value="">Choose a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </section>

        {projectId && canManageTeam && (
          <form
            onSubmit={addMember}
            className="mt-6 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:grid-cols-3"
          >
            <div>
              <label className="mb-2 block text-sm text-slate-400">
                User ID
              </label>
              <input
                type="number"
                required
                min="1"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
                placeholder="Enter user ID"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Project role
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="w-full rounded-xl bg-indigo-600 p-3 font-semibold hover:bg-indigo-500">
                Add / Update Member
              </button>
            </div>
          </form>
        )}

        {projectId && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Project Members</h2>

            {members.length === 0 ? (
              <p className="mt-4 text-slate-400">
                No members returned for this project yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {members.map((member) => {
                  const person = member.user || {};
                  const memberRole = member.role || "TEAM_MEMBER";

                  return (
                    <div
                      key={member.id || `${member.userId}-${projectId}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          {person.name || `User #${member.userId}`}
                        </p>
                        <p className="text-sm text-slate-400">
                          {person.email || "Email unavailable"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canManageTeam ? (
                          <select
                            value={memberRole}
                            onChange={(event) =>
                              changeRole(member.userId, event.target.value)
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm"
                          >
                            <option value="PROJECT_MANAGER">Project Manager</option>
                            <option value="TEAM_MEMBER">Team Member</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        ) : (
                          <span className="rounded-full bg-slate-800 px-3 py-2 text-sm">
                            {memberRole.replaceAll("_", " ")}
                          </span>
                        )}

                        {canManageTeam && (
                          <button
                            onClick={() => removeMember(member.userId)}
                            className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300 hover:bg-red-950"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          NeoStats Collaborative Project Management Platform
        </p>
      </div>
    </main>
  );
}
