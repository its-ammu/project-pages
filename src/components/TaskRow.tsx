"use client";

import { useState, useEffect, useRef } from "react";
import { getColor, COLOR_OPTIONS } from "@/types";
import type { Task } from "@/types";

interface TaskRowProps {
  task: Task;
  onToggle: () => Promise<unknown>;
  onUpdate: (updates: { title?: string; color?: string | null; due_date?: string | null }) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

export function TaskRow({ task, onToggle, onUpdate, onDelete }: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(false);
  const [val, setVal] = useState(task.title);
  const [editColor, setEditColor] = useState(task.color ?? "none");
  const [editDate, setEditDate] = useState(task.due_date ?? "");
  const editRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const datePickerContainerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && editRef.current) editRef.current.focus();
  }, [editing]);
  useEffect(() => {
    setVal(task.title);
    setEditColor(task.color ?? "none");
    setEditDate(task.due_date ?? "");
  }, [task.title, task.color, task.due_date]);

  useEffect(() => {
    if (!selected) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setSelected(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  useEffect(() => {
    const input = dateInputRef.current;
    if (!input) return;
    let closeOnClickOutside: (e: MouseEvent | TouchEvent) => void;
    const handleFocus = () => {
      closeOnClickOutside = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node;
        if (datePickerContainerRef.current?.contains(target)) return;
        input.blur();
        document.removeEventListener("mousedown", closeOnClickOutside);
        document.removeEventListener("touchstart", closeOnClickOutside);
      };
      requestAnimationFrame(() => {
        document.addEventListener("mousedown", closeOnClickOutside);
        document.addEventListener("touchstart", closeOnClickOutside, { passive: true });
      });
    };
    const handleBlur = () => {
      if (typeof closeOnClickOutside === "function") {
        document.removeEventListener("mousedown", closeOnClickOutside);
        document.removeEventListener("touchstart", closeOnClickOutside);
      }
    };
    input.addEventListener("focus", handleFocus);
    input.addEventListener("blur", handleBlur);
    return () => {
      input.removeEventListener("focus", handleFocus);
      input.removeEventListener("blur", handleBlur);
    };
  }, [editing]);

  const c = getColor(task.color ?? "none");

  const commit = async () => {
    if (val.trim()) {
      await onUpdate({
        title: val.trim(),
        color: editColor === "none" ? null : editColor,
        due_date: editDate ? editDate : null,
      });
    } else {
      setVal(task.title);
      setEditColor(task.color ?? "none");
      setEditDate(task.due_date ?? "");
    }
    setEditing(false);
    setSelected(false);
  };

  const showTrash = selected || editing;

  return (
    <div
      ref={rowRef}
      className="task-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderBottom: "1px solid #f0f0f0",
        padding: "7px 4px",
        position: "relative",
      }}
    >
      {editing ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            ref={editRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setVal(task.title);
                setEditColor(task.color ?? "none");
                setEditDate(task.due_date ?? "");
                setEditing(false);
                setSelected(false);
              }
            }}
            style={{
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              borderBottom: `1.5px solid ${getColor(editColor).dot}`,
              outline: "none",
              background: "transparent",
              padding: "1px 0",
              color: "#000",
              width: "100%",
            }}
          />
          <div className="task-edit-toolbar">
            <div ref={datePickerContainerRef} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <input
                ref={dateInputRef}
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                style={{ position: "absolute", opacity: 0, width: 1, height: 1, margin: -1, padding: 0, border: 0, clip: "rect(0,0,0,0)" }}
              />
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 6px",
                  color: editDate ? "#666" : "#ddd",
                }}
                title="Due date (optional)"
              >
                <CalendarIcon />
                {editDate && (
                  <span style={{ fontSize: 12 }}>
                    {formatDate(editDate)}
                  </span>
                )}
              </button>
              {editDate && (
                <button
                  type="button"
                  onClick={() => setEditDate("")}
                  style={{
                    fontSize: 11,
                    background: "none",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {COLOR_OPTIONS.map((co) => (
              <div
                key={co.id}
                onClick={() => setEditColor(co.id)}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: co.id === "none" ? "#fff" : co.dot,
                  border: co.id === "none" ? "1.5px solid #ccc" : "none",
                  cursor: "pointer",
                  outline:
                    editColor === co.id
                      ? `2px solid ${co.id === "none" ? "#aaa" : co.dot}`
                      : "2px solid transparent",
                  outlineOffset: 2,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {co.id === "none" && (
                  <span style={{ fontSize: 7, color: "#bbb" }}>✕</span>
                )}
              </div>
            ))}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                commit();
              }}
              style={{
                marginLeft: "auto",
                fontSize: 11,
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                padding: "2px 8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <span
            onClick={() => {
              setSelected(true);
              if (!task.completed) setEditing(true);
            }}
            style={{
              flex: 1,
              fontSize: 13,
              textDecoration: task.completed ? "line-through" : "none",
              fontWeight: 500,
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              cursor: task.completed ? "default" : "text",
              minWidth: 0,
            }}
          >
            {!task.completed && task.color && task.color !== "none" ? (
              <mark
                style={{
                  background: c.bg,
                  color: c.text,
                  padding: "2px 6px 2px 4px",
                  borderRadius: 8,
                  display: "inline",
                  lineHeight: 1.5,
                }}
              >
                {task.title}
              </mark>
            ) : (
              <span style={{ color: task.completed ? "#bbb" : "#444" }}>
                {task.title}
              </span>
            )}
          </span>
          {task.due_date && formatDate(task.due_date) && (
            <span style={{ fontSize: 12, color: "#999", flexShrink: 0 }}>
              {formatDate(task.due_date)}
            </span>
          )}
        </>
      )}

      <div
        className="task-actions"
        onClick={() => onToggle()}
        style={{
          width: 15,
          height: 15,
          borderRadius: 4,
          border: "1.5px solid #bbb",
          background: task.completed ? "#bbb" : "transparent",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        {task.completed && (
          <span style={{ fontSize: 9, color: "#fff" }}>✓</span>
        )}
      </div>

      {showTrash && (
        <button
          onClick={() => onDelete()}
          style={{
            background: "none",
            border: "none",
            color: "#bbb",
            cursor: "pointer",
            padding: "0 2px",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Delete task"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
