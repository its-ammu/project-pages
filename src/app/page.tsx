"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { StatsPanel } from "@/components/StatsPanel";
import { AuthForm } from "@/components/AuthForm";

export default function Home() {
  const {
    projects,
    loading,
    configError,
    authError,
    dataError,
    userId,
    signIn,
    signUp,
    signOut,
    addProject,
    archiveProject,
    deleteProject,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    reorderTasks,
  } = useProjects();

  const [view, setView] = useState<"dashboard" | "stats">("dashboard");
  const [showArchived, setShowArchived] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const addTaskInputRef = useRef<HTMLInputElement>(null);
  const newProjInputRef = useRef<HTMLInputElement>(null);

  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  const totalTasks = displayedProjects.reduce((a, p) => a + (p.tasks?.length ?? 0), 0);
  const doneTasks = displayedProjects.reduce(
    (a, p) => a + (p.tasks?.filter((t) => t.completed).length ?? 0),
    0
  );
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleAddProject = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = newProjectTitle.trim();
    if (!t) return;
    await addProject(t);
    setNewProjectTitle("");
    setAddingProject(false);
  };

  useEffect(() => {
    if (addingTask && addTaskInputRef.current) {
      addTaskInputRef.current.focus();
    }
  }, [addingTask]);

  const addTaskWithColor = async (
    projectId: string,
    title: string,
    color: string | null,
    dueDate?: string | null
  ) => {
    await addTask(projectId, title, color, dueDate);
    setAddingTask(null);
  };

  const setupError = configError || authError || dataError;
  if (setupError) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ background: "#fafaf8" }}
      >
        <div
          className="max-w-md rounded-xl border p-6 text-center"
          style={{
            borderColor: "#fcd34d",
            background: "#fffbeb",
          }}
        >
          <h2 className="mb-2 text-lg font-semibold" style={{ color: "#92400e" }}>
            {configError ? "Setup required" : "Connection error"}
          </h2>
          <p className="mb-4 text-sm" style={{ color: "#92400e" }}>
            {setupError}
          </p>
          {configError && (
            <p className="text-xs" style={{ color: "#78716c" }}>
              Copy <code className="rounded px-1" style={{ background: "#e7e5e4" }}>.env.local.example</code> to{" "}
              <code className="rounded px-1" style={{ background: "#e7e5e4" }}>.env.local</code> and add your Supabase credentials.
            </p>
          )}
          {dataError && (
            <p className="text-xs mb-4" style={{ color: "#78716c" }}>
              Run the SQL in <code className="rounded px-1" style={{ background: "#e7e5e4" }}>supabase/migrations/001_initial_schema.sql</code> in your Supabase SQL Editor to create the tables.
            </p>
          )}
          {(authError || dataError) && !configError && (
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "#fafaf8" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: "#e7e5e4", borderTopColor: "#444" }}
        />
      </div>
    );
  }

  if (!userId) {
    return (
      <AuthForm
        onSignIn={async (email, password) => {
          const { error } = await signIn(email, password);
          return { error: error ?? undefined };
        }}
        onSignUp={async (email, password) => {
          const { error } = await signUp(email, password);
          return { error: error ?? undefined };
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf8",
        fontFamily: "var(--font-inter), 'Helvetica Neue', sans-serif",
        color: "#222",
      }}
    >
      <style>{`
        .task-row:hover .task-actions { opacity: 1; }
        .task-row .task-actions { opacity: 0; transition: opacity 0.15s; }
        @media (max-width: 1024px) {
          .task-row .task-actions { opacity: 1; }
        }
      `}</style>
      <div
        className="nav-bar"
        style={{
          borderBottom: "1px solid #ebebeb",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            style={{ objectFit: "contain", flexShrink: 0 }}
            priority
          />
          <span
            className="nav-logo"
            style={{
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.3px",
              color: "#222",
            }}
          >
            Project Pages
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["dashboard", "stats"] as const).map((v) => (
              <button
                key={v}
                onClick={() => {
                  setView(v);
                  if (v === "dashboard") setShowArchived(false);
                }}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  background: view === v ? "#222" : "transparent",
                  color: view === v ? "#fff" : "#888",
                  fontWeight: view === v ? 600 : 400,
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {view === "dashboard" && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: showArchived ? "#222" : "#aaa",
                }}
                title={showArchived ? "Show active projects" : "Show archived projects"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8v13H3V8" />
                  <path d="M1 3h22v5H1z" />
                  <path d="M10 12h4" />
                </svg>
              </button>
            )}
            <span style={{ fontSize: 13, color: "#aaa" }}>
              {doneTasks}/{totalTasks} done
            </span>
          </div>
          <button
            onClick={() => signOut()}
            style={{
              fontSize: 12,
              color: "#888",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div
        className="main-content"
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {view === "dashboard" && (
          <>
            {!showArchived && (
            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#aaa",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Overall progress
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#555",
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: "#eee",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background:
                      "#222",
                    borderRadius: 4,
                    transition: "width 0.4s",
                  }}
                />
              </div>
            </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {showArchived && displayedProjects.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: 40,
                    color: "#999",
                    fontSize: 14,
                  }}
                >
                  No archived projects. Archive a project from the main view.
                </div>
              )}
              {displayedProjects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    onAddTask={addTaskWithColor}
                    onToggleTask={toggleTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onDeleteProject={deleteProject}
                    onArchiveProject={archiveProject}
                    onReorderTasks={reorderTasks}
                    addingTask={addingTask}
                    onSetAddingTask={setAddingTask}
                    addTaskInputRef={addTaskInputRef}
                  />
              ))}
              {!showArchived && (
              <div
                onClick={() => {
                  setAddingProject(true);
                  setTimeout(
                    () => newProjInputRef.current?.focus(),
                    50
                  );
                }}
                style={{
                  border: "1.5px dashed #ddd",
                  borderRadius: 14,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 160,
                  cursor: "pointer",
                }}
              >
                {addingProject ? (
                  <div
                    style={{ width: "100%" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={newProjInputRef}
                      id="new-proj-input"
                      value={newProjectTitle}
                      onChange={(e) =>
                        setNewProjectTitle(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddProject();
                        if (e.key === "Escape") {
                          setAddingProject(false);
                          setNewProjectTitle("");
                        }
                      }}
                      placeholder="Project name…"
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: "1.5px solid #ccc",
                        outline: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        background: "transparent",
                        padding: "4px 0",
                        marginBottom: 10,
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAddProject()}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          background: "#222",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setAddingProject(false);
                          setNewProjectTitle("");
                        }}
                        style={{
                          flex: 1,
                          padding: "7px 0",
                          background: "#f0f0f0",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 28,
                        color: "#ccc",
                        marginBottom: 8,
                      }}
                    >
                      +
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#bbb",
                        fontWeight: 500,
                      }}
                    >
                      New Project
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          </>
        )}
        {view === "stats" && <StatsPanel projects={activeProjects} />}
      </div>
    </div>
  );
}
