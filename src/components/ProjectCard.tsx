"use client";

import { useState, useEffect, useRef } from "react";
import { TaskRow } from "./TaskRow";
import { AddTaskForm } from "./AddTaskForm";
import type { Project, Task } from "@/types";
import { projectProgressUnits, isTaskDoneForDisplay } from "@/lib/taskProgress";

interface ProjectCardProps {
  project: Project & { tasks: Task[] };
  onAddTask: (projectId: string, title: string, color: string | null, dueDate?: string | null) => Promise<unknown>;
  onToggleTask: (taskId: string) => Promise<unknown>;
  onOpenTask: (taskId: string) => void;
  onUpdateProject: (projectId: string, updates: { title?: string; archived?: boolean }) => Promise<unknown>;
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
  onOpenTask,
  onUpdateProject,
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
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(project.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleVal(project.title);
  }, [project.title]);
  useEffect(() => {
    if (editingTitle && titleInputRef.current) titleInputRef.current.focus();
  }, [editingTitle]);

  const incompleteTasks = project.tasks.filter((t) => !isTaskDoneForDisplay(t));
  const completedTasks = project.tasks.filter((t) => isTaskDoneForDisplay(t));
  const visibleCompletedTasks = showAllCompleted
    ? completedTasks
    : completedTasks.slice(0, 5);
  const hiddenCompletedCount = completedTasks.length - visibleCompletedTasks.length;

  const { done, total } = projectProgressUnits(project);
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
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = titleVal.trim();
                if (t) onUpdateProject(project.id, { title: t });
                setEditingTitle(false);
              }
              if (e.key === "Escape") {
                setTitleVal(project.title);
                setEditingTitle(false);
              }
            }}
            onBlur={() => {
              const t = titleVal.trim();
              if (t && t !== project.title) onUpdateProject(project.id, { title: t });
              setEditingTitle(false);
            }}
            style={{
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderBottom: "1.5px solid #ccc",
              outline: "none",
              background: "transparent",
              padding: "1px 0",
              flex: 1,
              minWidth: 0,
              color: "#222",
            }}
          />
        ) : (
          <span
            onClick={() => setEditingTitle(true)}
            style={{
              fontWeight: 700,
              fontSize: 15,
              cursor: "text",
              flex: 1,
              minWidth: 0,
            }}
          >
            {project.title}
          </span>
        )}
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
        {total === 0 && addingTask !== project.id && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "18px 8px 8px",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 8 }}>
              <rect x="7" y="4" width="18" height="24" rx="2" stroke="#e0e0e0" strokeWidth="1.2" />
              <line x1="11" y1="11" x2="21" y2="11" stroke="#ebebeb" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="15.5" x2="18" y2="15.5" stroke="#ebebeb" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="11" y1="20" x2="20" y2="20" stroke="#ebebeb" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, color: "#bbb", fontWeight: 500 }}>
              No tasks yet
            </span>
          </div>
        )}
        {incompleteTasks.map((task) => (
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
              onOpenDetail={() => onOpenTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}
        {visibleCompletedTasks.map((task) => (
          <div key={task.id}>
            <TaskRow
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onOpenDetail={() => onOpenTask(task.id)}
              onDelete={() => onDeleteTask(task.id)}
            />
          </div>
        ))}
        {!showAllCompleted && hiddenCompletedCount > 0 && (
          <button
            onClick={() => setShowAllCompleted(true)}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              fontSize: 12,
              cursor: "pointer",
              padding: "6px 4px",
              textAlign: "left",
              fontWeight: 500,
            }}
          >
            + {hiddenCompletedCount} more completed
          </button>
        )}
        {showAllCompleted && completedTasks.length > 5 && (
          <button
            onClick={() => setShowAllCompleted(false)}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              fontSize: 12,
              cursor: "pointer",
              padding: "6px 4px",
              textAlign: "left",
              fontWeight: 500,
            }}
          >
            Show less
          </button>
        )}
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
