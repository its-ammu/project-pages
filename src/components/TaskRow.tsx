"use client";

import { useState, useEffect, useRef } from "react";
import { getColor, isOverdue, isDueToday } from "@/types";
import { isTaskDoneForDisplay } from "@/lib/taskProgress";
import type { Task } from "@/types";

interface TaskRowProps {
  task: Task;
  onToggle: () => Promise<unknown>;
  onOpenDetail: () => void;
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

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

export function TaskRow({ task, onToggle, onOpenDetail, onDelete }: TaskRowProps) {
  const [selected, setSelected] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const rowDone = isTaskDoneForDisplay(task);
  const subs = task.subtasks ?? [];
  const subDone = subs.filter((s) => s.completed).length;
  const subLabel = subs.length > 0 ? `${subDone}/${subs.length}` : null;

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

  const c = getColor(task.color ?? "none");
  const showTrash = selected;

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
      <span
        onClick={(e) => {
          e.stopPropagation();
          setSelected(true);
          onOpenDetail();
        }}
        style={{
          flex: 1,
          fontSize: 13,
          textDecoration: rowDone ? "line-through" : "none",
          fontWeight: 500,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          minWidth: 0,
        }}
      >
        {!rowDone && task.color && task.color !== "none" ? (
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
          <span style={{ color: rowDone ? "#bbb" : "#444" }}>{task.title}</span>
        )}
        {subLabel && (
          <span style={{ fontSize: 11, color: "#aaa", flexShrink: 0, fontWeight: 500 }}>{subLabel}</span>
        )}
      </span>
      {task.due_date && formatDate(task.due_date) && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          style={{
            fontSize: 12,
            color: isOverdue(task) ? "#c0392b" : isDueToday(task) ? "#555" : "#999",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
          }}
        >
          {isOverdue(task) && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#c0392b",
                flexShrink: 0,
              }}
              title="Overdue"
            />
          )}
          {formatDate(task.due_date)}
        </span>
      )}

      <div
        className="task-actions"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          width: 15,
          height: 15,
          borderRadius: 4,
          border: "1.5px solid #bbb",
          background: rowDone ? "#bbb" : "transparent",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        {rowDone && <span style={{ fontSize: 9, color: "#fff" }}>✓</span>}
      </div>

      {showTrash && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
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
