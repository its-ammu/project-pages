"use client";

import { useState } from "react";
import { TaskRow } from "./TaskRow";
import { AddTaskForm } from "./AddTaskForm";
import type { Project, Task } from "@/types";

interface ProjectCardProps {
  project: Project & { tasks: Task[] };
  onAddTask: (projectId: string, title: string, color: string | null, dueDate?: string | null) => Promise<unknown>;
  onToggleTask: (taskId: string) => Promise<unknown>;
  onUpdateTask: (taskId: string, updates: { title?: string; color?: string | null; due_date?: string | null }) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  onDeleteProject: (id: string) => Promise<unknown>;
  onArchiveProject: (id: string, archived: boolean) => Promise<unknown>;
  onReorderTasks: (projectId: string, taskIds: string[]) => Promise<unknown>;
  addingTask: string | null;
  onSetAddingTask: (id: string | null) => void;
  addTaskInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ProjectCard({
  project,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteProject,
  onArchiveProject,
  onReorderTasks,
  addingTask,
  onSetAddingTask,
  addTaskInputRef,
}: ProjectCardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const done = project.tasks.filter((t) => t.completed).length;
  const total = project.tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.setData("application/json", JSON.stringify({ taskId }));
  };
  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== taskId) setDragOverId(taskId);
  };
  const handleDragLeave = () => setDragOverId(null);
  const handleDrop = async (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    setDragOverId(null);
    setDraggedId(null);
    const fromId = e.dataTransfer.getData("text/plain");
    if (!fromId || fromId === taskId) return;
    const tasks = [...project.tasks];
    const fromIdx = tasks.findIndex((t) => t.id === fromId);
    const toIdx = tasks.findIndex((t) => t.id === taskId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [removed] = tasks.splice(fromIdx, 1);
    tasks.splice(toIdx, 0, removed);
    await onReorderTasks(project.id, tasks.map((t) => t.id));
  };
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "20px 20px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>{project.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => onArchiveProject(project.id, !project.archived)}
            style={{
              background: "none",
              border: "none",
              color: "#bbb",
              cursor: "pointer",
              fontSize: 12,
              padding: "2px 6px",
            }}
            title={project.archived ? "Restore" : "Archive"}
          >
            {project.archived ? "Restore" : "Archive"}
          </button>
          <button
            onClick={() => onDeleteProject(project.id)}
            style={{
              background: "none",
              border: "none",
              color: "#ddd",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#bbb",
          marginBottom: 10,
          fontWeight: 500,
        }}
      >
        {done}/{total} tasks
      </div>
      <div
        style={{
          height: 3,
          background: "#f0f0f0",
          borderRadius: 3,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#222",
            borderRadius: 3,
            transition: "width 0.3s",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {project.tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, task.id)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: draggedId === task.id ? 0.5 : 1,
              borderTop: dragOverId === task.id ? "2px solid #222" : "2px solid transparent",
              cursor: "grab",
            }}
          >
            <TaskRow
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onUpdate={(updates) =>
                onUpdateTask(task.id, {
                  ...updates,
                  color:
                    updates.color === "none" || updates.color === null
                      ? null
                      : updates.color,
                })
              }
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}
      </div>

      {addingTask === project.id ? (
        <AddTaskForm
          projectId={project.id}
          onAdd={onAddTask}
          isActive={true}
          onCancel={() => onSetAddingTask(null)}
          inputRef={addTaskInputRef}
        />
      ) : (
        <button
          onClick={() => onSetAddingTask(project.id)}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "7px 0",
            background: "transparent",
            border: "1.5px dashed #e0e0e0",
            borderRadius: 8,
            fontSize: 12,
            color: "#bbb",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Add task
        </button>
      )}
    </div>
  );
}
