"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { COLOR_OPTIONS } from "@/types";
import type { Task, Subtask } from "@/types";
import { ThemedDatePicker } from "@/components/ThemedDatePicker";

interface TaskDetailPanelProps {
  task: Task;
  projectTitle: string;
  onClose: () => void;
  onUpdateTask: (
    taskId: string,
    updates: {
      title?: string;
      color?: string | null;
      due_date?: string | null;
      notes?: string | null;
    }
  ) => Promise<unknown>;
  onToggleTask: (taskId: string) => Promise<unknown>;
  onDeleteTask: (taskId: string) => Promise<unknown>;
  onAddSubtask: (taskId: string, title: string) => Promise<unknown>;
  onUpdateSubtask: (
    subtaskId: string,
    taskId: string,
    updates: { title?: string; completed?: boolean }
  ) => Promise<unknown>;
  onDeleteSubtask: (subtaskId: string, taskId: string) => Promise<unknown>;
}

function SubtaskRow({
  s,
  taskId,
  onUpdateSubtask,
  onDeleteSubtask,
}: {
  s: Subtask;
  taskId: string;
  onUpdateSubtask: TaskDetailPanelProps["onUpdateSubtask"];
  onDeleteSubtask: TaskDetailPanelProps["onDeleteSubtask"];
}) {
  const [val, setVal] = useState(s.title);
  useEffect(() => {
    setVal(s.title);
  }, [s.id, s.title]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
      }}
    >
      <button
        type="button"
        onClick={() => onUpdateSubtask(s.id, taskId, { completed: !s.completed })}
        style={{
          width: 15,
          height: 15,
          borderRadius: 3,
          border: "1.5px solid #bbb",
          background: s.completed ? "#bbb" : "transparent",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.completed && <span style={{ fontSize: 8, color: "#fff" }}>✓</span>}
      </button>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const v = val.trim();
          if (!v) onDeleteSubtask(s.id, taskId);
          else if (v !== s.title) onUpdateSubtask(s.id, taskId, { title: v });
        }}
        style={{
          flex: 1,
          fontSize: 13,
          border: "none",
          borderBottom: "1px solid transparent",
          outline: "none",
          background: "transparent",
          color: s.completed ? "#bbb" : "#444",
          textDecoration: s.completed ? "line-through" : "none",
          minWidth: 0,
        }}
      />
      <button
        type="button"
        onClick={() => onDeleteSubtask(s.id, taskId)}
        style={{
          background: "none",
          border: "none",
          color: "#ddd",
          cursor: "pointer",
          fontSize: 16,
          padding: "0 4px",
          lineHeight: 1,
        }}
        aria-label="Remove checklist item"
      >
        ×
      </button>
    </div>
  );
}

export function TaskDetailPanel({
  task,
  projectTitle,
  onClose,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [editColor, setEditColor] = useState(task.color ?? "none");
  const [editDate, setEditDate] = useState(task.due_date ?? "");
  const [newSubTitle, setNewSubTitle] = useState("");
  const notesDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setEditColor(task.color ?? "none");
    setEditDate(task.due_date ?? "");
  }, [task.id, task.title, task.notes, task.color, task.due_date]);

  const flushNotes = useCallback(() => {
    const next = notes.trim();
    const prev = (task.notes ?? "").trim();
    if (next !== prev) {
      onUpdateTask(task.id, { notes: next === "" ? null : notes });
    }
  }, [notes, task.id, task.notes, onUpdateTask]);

  const handleClose = useCallback(() => {
    if (notesDebounce.current) {
      clearTimeout(notesDebounce.current);
      notesDebounce.current = null;
    }
    const next = notes.trim();
    const prev = (task.notes ?? "").trim();
    if (next !== prev) {
      onUpdateTask(task.id, { notes: next === "" ? null : notes });
    }
    onClose();
  }, [notes, task.id, task.notes, onClose, onUpdateTask]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  useEffect(() => {
    return () => {
      if (notesDebounce.current) clearTimeout(notesDebounce.current);
    };
  }, []);

  const scheduleNotesSave = () => {
    if (notesDebounce.current) clearTimeout(notesDebounce.current);
    notesDebounce.current = setTimeout(() => {
      notesDebounce.current = null;
      const next = notes.trim();
      const prev = (task.notes ?? "").trim();
      if (next !== prev) {
        onUpdateTask(task.id, { notes: next === "" ? null : notes });
      }
    }, 450);
  };

  const subs = task.subtasks ?? [];
  const rowDone = subs.length > 0 ? subs.every((s) => s.completed) : task.completed;

  return (
    <>
      <div
        role="presentation"
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.08)",
          zIndex: 1000,
        }}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(440px, 100vw)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.07)",
          borderLeft: "1px solid #ebebeb",
          fontFamily: "var(--font-inter), 'Helvetica Neue', sans-serif",
        }}
      >
        <div
          className="task-detail-paper"
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px 22px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#aaa",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                {projectTitle}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  const t = title.trim();
                  if (t && t !== task.title) onUpdateTask(task.id, { title: t });
                  if (!t) setTitle(task.title);
                }}
                style={{
                  width: "100%",
                  fontSize: 17,
                  fontWeight: 700,
                  border: "none",
                  borderBottom: "1.5px solid #f0ebe3",
                  outline: "none",
                  background: "transparent",
                  padding: "4px 0",
                  color: "#222",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                cursor: "pointer",
                fontSize: 22,
                lineHeight: 1,
                padding: 4,
                flexShrink: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: "1.5px solid #bbb",
                background: rowDone ? "#bbb" : "transparent",
                cursor: "pointer",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={rowDone ? "Mark incomplete" : "Mark done"}
            >
              {rowDone && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}
            </button>
            <span style={{ fontSize: 12, color: "#888" }}>Done</span>

            <ThemedDatePicker
              value={editDate}
              onChange={(iso) => {
                setEditDate(iso ?? "");
                onUpdateTask(task.id, { due_date: iso });
              }}
            />
            {editDate && (
              <button
                type="button"
                onClick={() => {
                  setEditDate("");
                  onUpdateTask(task.id, { due_date: null });
                }}
                style={{ fontSize: 11, background: "none", border: "none", color: "#999", cursor: "pointer" }}
              >
                Clear date
              </button>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Label
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COLOR_OPTIONS.map((co) => (
                <button
                  key={co.id}
                  type="button"
                  onClick={() => {
                    setEditColor(co.id);
                    onUpdateTask(task.id, { color: co.id === "none" ? null : co.id });
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: co.id === "none" ? "#fff" : co.dot,
                    border: co.id === "none" ? "1.5px solid #ccc" : "none",
                    cursor: "pointer",
                    outline: editColor === co.id ? `2px solid ${co.id === "none" ? "#aaa" : co.dot}` : "2px solid transparent",
                    outlineOffset: 2,
                  }}
                  aria-label={co.id}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                scheduleNotesSave();
              }}
              onBlur={() => {
                if (notesDebounce.current) {
                  clearTimeout(notesDebounce.current);
                  notesDebounce.current = null;
                }
                flushNotes();
              }}
              placeholder="Add notes…"
              rows={6}
              style={{
                width: "100%",
                resize: "vertical",
                minHeight: 120,
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.5,
                color: "#444",
                border: "1px solid #ebe8e2",
                borderRadius: 8,
                outline: "none",
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.85)",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Checklist
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {subs.map((s) => (
                <SubtaskRow
                  key={s.id}
                  s={s}
                  taskId={task.id}
                  onUpdateSubtask={onUpdateSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                />
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const t = newSubTitle.trim();
                if (!t) return;
                await onAddSubtask(task.id, t);
                setNewSubTitle("");
              }}
              style={{ marginTop: 10 }}
            >
              <input
                value={newSubTitle}
                onChange={(e) => setNewSubTitle(e.target.value)}
                placeholder="+ Add checklist item"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: 13,
                  border: "1.5px dashed #e0e0e0",
                  borderRadius: 8,
                  outline: "none",
                  background: "transparent",
                  color: "#888",
                  boxSizing: "border-box",
                }}
              />
            </form>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <button
              type="button"
              onClick={async () => {
                if (notesDebounce.current) {
                  clearTimeout(notesDebounce.current);
                  notesDebounce.current = null;
                }
                await onDeleteTask(task.id);
                onClose();
              }}
              style={{
                fontSize: 12,
                color: "#c0392b",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontWeight: 500,
              }}
            >
              Delete task
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
