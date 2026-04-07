import type { Project, Task } from "@/types";

/** Progress counts tasks without subtasks as one unit each; tasks with subtasks use each subtask as a unit. */
export function taskProgressUnits(task: Task): { done: number; total: number } {
  const subs = task.subtasks ?? [];
  if (subs.length > 0) {
    const done = subs.filter((s) => s.completed).length;
    return { done, total: subs.length };
  }
  return { done: task.completed ? 1 : 0, total: 1 };
}

/** Checkbox + strikethrough: all subtasks done, or no subtasks and task.completed */
export function isTaskDoneForDisplay(task: Task): boolean {
  const subs = task.subtasks ?? [];
  if (subs.length > 0) return subs.every((s) => s.completed);
  return task.completed;
}

export function projectProgressUnits(project: Project & { tasks: Task[] }): {
  done: number;
  total: number;
} {
  let done = 0;
  let total = 0;
  for (const t of project.tasks ?? []) {
    const u = taskProgressUnits(t);
    done += u.done;
    total += u.total;
  }
  return { done, total };
}
