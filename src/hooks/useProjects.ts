"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Project, Task, Subtask } from "@/types";

async function apiFetch(
  path: string,
  token: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

export function useProjects() {
  const [projects, setProjects] = useState<(Project & { tasks: Task[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const supabase = useMemo(() => {
    if (!isSupabaseConfigured()) return null;
    try {
      return createSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Not configured" };
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Not configured" };
      setAuthError(null);
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProjects([]);
    setUserId(null);
  }, [supabase]);

  const fetchData = useCallback(async (token: string) => {
    console.log("[Planner] fetchData: calling API /api/projects...");
    const res = await apiFetch("/api/projects", token);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    const { projects: data } = await res.json();
    console.log("[Planner] Projects fetched:", data?.length ?? 0);
    setProjects(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.error("[Planner] Supabase not configured");
      setLoading(false);
      setConfigError(
        "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
      );
      return;
    }
    console.log("[Planner] Supabase configured, starting auth check");
    setAuthError(null);
    setDataError(null);
    const init = async () => {
      const timeout = setTimeout(async () => {
        console.warn("[Planner] Init timed out after 15s - clearing stale session");
        setAuthError("Connection timed out. Check your network and Supabase URL.");
        setLoading(false);
        await supabase.auth.signOut();
        setUserId(null);
        setProjects([]);
      }, 15000);
      try {
        console.log("[Planner] Calling auth.getSession()...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("[Planner] getSession error:", sessionError);
          setAuthError(sessionError.message);
          setLoading(false);
          return;
        }
        if (session?.user) {
          setUserId(session.user.id);
          console.log("[Planner] User signed in, fetching via API...");
          try {
            await fetchData(session.access_token);
          } catch (err) {
            console.error("[Planner] API fetch error:", err);
            setDataError(err instanceof Error ? err.message : "Failed to load data");
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[Planner] Init error:", err);
        setAuthError(err instanceof Error ? err.message : "Failed to connect");
        setLoading(false);
      } finally {
        clearTimeout(timeout);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          setUserId(session.user.id);
          try {
            await fetchData(session.access_token);
          } catch {
            setProjects([]);
            setLoading(false);
          }
        }
        if (event === "SIGNED_OUT") {
          setUserId(null);
          setProjects([]);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchData]);

  const getToken = useCallback(async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, [supabase]);

  const addProject = useCallback(
    async (title: string) => {
      const token = await getToken();
      if (!token || !userId) return { data: null, error: new Error("Not authenticated") };
      const res = await apiFetch("/api/projects", token, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: new Error(json.error || "Failed") };
      setProjects((prev) => [...prev, json.data]);
      return { data: json.data, error: null };
    },
    [userId, getToken]
  );

  const updateProject = useCallback(
    async (id: string, updates: { title?: string; archived?: boolean }) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const res = await apiFetch(`/api/projects/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (!res.ok) return { error: new Error("Failed") };
      const json = await res.json().catch(() => ({}));
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      return { data: json.data, error: null };
    },
    [getToken]
  );

  const archiveProject = useCallback(
    async (id: string, archived: boolean) => {
      return updateProject(id, { archived });
    },
    [updateProject]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const res = await apiFetch(`/api/projects/${id}`, token, { method: "DELETE" });
      if (!res.ok) return { error: new Error("Failed") };
      setProjects((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    },
    [getToken]
  );

  const addTask = useCallback(
    async (projectId: string, title: string, color: string | null = null, dueDate?: string | null) => {
      const token = await getToken();
      if (!token) return { data: null, error: new Error("Not authenticated") };
      const project = projects.find((p) => p.id === projectId);
      const position = project?.tasks?.length ?? 0;
      const res = await apiFetch("/api/tasks", token, {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, title, color, position, due_date: dueDate ?? null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: new Error(json.error || "Failed") };
      const newTask: Task = {
        ...json.data,
        subtasks: json.data.subtasks ?? [],
      };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, tasks: [...(p.tasks ?? []), newTask] }
            : p
        )
      );
      return { data: newTask, error: null };
    },
    [projects, getToken]
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const project = projects.find((p) => p.tasks?.some((t) => t.id === taskId));
      const task = project?.tasks?.find((t) => t.id === taskId);
      if (!task) return { error: new Error("Task not found") };
      const subs = task.subtasks ?? [];
      if (subs.length > 0) {
        const allDone = subs.every((s) => s.completed);
        const next = !allDone;
        const results = await Promise.all(
          subs.map((s) =>
            apiFetch(`/api/subtasks/${s.id}`, token, {
              method: "PATCH",
              body: JSON.stringify({ completed: next }),
            })
          )
        );
        if (results.some((r) => !r.ok)) return { error: new Error("Failed") };
        const taskRes = await apiFetch(`/api/tasks/${taskId}`, token, {
          method: "PATCH",
          body: JSON.stringify({ completed: next }),
        });
        if (!taskRes.ok) return { error: new Error("Failed") };
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project!.id
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          completed: next,
                          subtasks: (t.subtasks ?? []).map((s) => ({
                            ...s,
                            completed: next,
                          })),
                        }
                      : t
                  ),
                }
              : p
          )
        );
        return { error: null };
      }
      const res = await apiFetch(`/api/tasks/${taskId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) return { error: new Error("Failed") };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project!.id
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId ? { ...t, completed: !t.completed } : t
                ),
              }
            : p
        )
      );
      return { error: null };
    },
    [projects, getToken]
  );

  const reorderTasks = useCallback(
    async (projectId: string, taskIds: string[]) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const res = await apiFetch(`/api/projects/${projectId}/tasks/reorder`, token, {
        method: "POST",
        body: JSON.stringify({ taskIds }),
      });
      if (!res.ok) return { error: new Error("Failed") };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: taskIds
                  .map((id) => p.tasks.find((t) => t.id === id))
                  .filter(Boolean) as Task[],
              }
            : p
        )
      );
      return { error: null };
    },
    [getToken]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: {
        title?: string;
        color?: string | null;
        due_date?: string | null;
        notes?: string | null;
        completed?: boolean;
      }
    ) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const project = projects.find((p) => p.tasks?.some((t) => t.id === taskId));
      const res = await apiFetch(`/api/tasks/${taskId}`, token, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (!res.ok) return { error: new Error("Failed") };
      if (project) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...updates } : t
                  ),
                }
              : p
          )
        );
      }
      return { error: null };
    },
    [projects, getToken]
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      const token = await getToken();
      if (!token) return { data: null, error: new Error("Not authenticated") };
      const res = await apiFetch(`/api/tasks/${taskId}/subtasks`, token, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { data: null, error: new Error(json.error || "Failed") };
      const sub = json.data as Subtask;
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...(t.subtasks ?? []), sub] }
              : t
          ),
        }))
      );
      return { data: sub, error: null };
    },
    [getToken]
  );

  const updateSubtask = useCallback(
    async (
      subtaskId: string,
      taskId: string,
      updates: { title?: string; completed?: boolean }
    ) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const task = projects
        .find((p) => p.tasks?.some((t) => t.id === taskId))
        ?.tasks.find((t) => t.id === taskId);
      if (!task) return { error: new Error("Task not found") };
      const res = await apiFetch(`/api/subtasks/${subtaskId}`, token, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { error: new Error(json.error || "Failed") };
      const updated = json.data as Subtask | undefined;
      if (!updated) return { error: new Error("Failed") };
      const newSubs = (task.subtasks ?? []).map((s) =>
        s.id === subtaskId ? updated : s
      );
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: newSubs } : t
          ),
        }))
      );
      if (newSubs.length > 0) {
        const allDone = newSubs.every((s) => s.completed);
        if (task.completed !== allDone) {
          await updateTask(taskId, { completed: allDone });
        }
      }
      return { error: null };
    },
    [getToken, projects, updateTask]
  );

  const deleteSubtask = useCallback(
    async (subtaskId: string, taskId: string) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const task = projects
        .find((p) => p.tasks?.some((t) => t.id === taskId))
        ?.tasks.find((t) => t.id === taskId);
      if (!task) return { error: new Error("Task not found") };
      const remaining = (task.subtasks ?? []).filter((s) => s.id !== subtaskId);
      const res = await apiFetch(`/api/subtasks/${subtaskId}`, token, {
        method: "DELETE",
      });
      if (!res.ok) return { error: new Error("Failed") };
      setProjects((prev) =>
        prev.map((p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: remaining } : t
          ),
        }))
      );
      if (remaining.length > 0) {
        const allDone = remaining.every((s) => s.completed);
        if (task.completed !== allDone) {
          await updateTask(taskId, { completed: allDone });
        }
      }
      return { error: null };
    },
    [getToken, projects, updateTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const token = await getToken();
      if (!token) return { error: new Error("Not authenticated") };
      const project = projects.find((p) => p.tasks?.some((t) => t.id === taskId));
      const res = await apiFetch(`/api/tasks/${taskId}`, token, {
        method: "DELETE",
      });
      if (!res.ok) return { error: new Error("Failed") };
      if (project) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id
              ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
              : p
          )
        );
      }
      return { error: null };
    },
    [projects, getToken]
  );

  return {
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
    updateProject,
    deleteProject,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    reorderTasks,
    addSubtask,
    updateSubtask,
    deleteSubtask,
  };
}
