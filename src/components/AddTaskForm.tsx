"use client";

import { useState, useRef, useEffect } from "react";
import { COLOR_OPTIONS } from "@/types";

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface AddTaskFormProps {
  projectId: string;
  onAdd: (projectId: string, title: string, color: string | null, dueDate?: string | null) => Promise<unknown>;
  isActive: boolean;
  onCancel: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function AddTaskForm({
  projectId,
  onAdd,
  isActive,
  onCancel,
  inputRef,
}: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const datePickerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      setText("");
      setColor("none");
      setDueDate("");
    }
  }, [isActive]);

  useEffect(() => {
    const input = dateInputRef.current;
    if (!input || !isActive) return;
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
  }, [isActive]);

  const handleSubmit = async () => {
    const t = text.trim();
    if (!t || loading) return;
    setLoading(true);
    await onAdd(projectId, t, color === "none" ? null : color, dueDate || null);
    setText("");
    setColor("none");
    setDueDate("");
    setLoading(false);
    onCancel();
  };

  if (!isActive) return null;

  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Task name…"
        style={{
          border: "none",
          borderBottom: "1.5px solid #ddd",
          outline: "none",
          fontSize: 13,
          padding: "4px 0",
          background: "transparent",
          width: "100%",
        }}
      />
      <div className="add-task-toolbar">
        <div ref={datePickerContainerRef} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            ref={dateInputRef}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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
            color: dueDate ? "#666" : "#ddd",
          }}
          title="Due date (optional)"
        >
          <CalendarIcon />
          {dueDate && (
            <span style={{ fontSize: 12 }}>
              {new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </button>
        {dueDate && (
          <button
            type="button"
            onClick={() => setDueDate("")}
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
        {COLOR_OPTIONS.map((c) => (
          <div
            key={c.id}
            onClick={() => setColor(c.id)}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: c.id === "none" ? "#fff" : c.dot,
              border: c.id === "none" ? "1.5px solid #ccc" : "none",
              cursor: "pointer",
              outline:
                color === c.id
                  ? `2px solid ${c.id === "none" ? "#aaa" : c.dot}`
                  : "2px solid transparent",
              outlineOffset: 2,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {c.id === "none" && (
              <span style={{ fontSize: 8, color: "#bbb" }}>✕</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => handleSubmit()}
          disabled={!text.trim() || loading}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "#222",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            opacity: !text.trim() || loading ? 0.5 : 1,
          }}
        >
          Add
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "6px 0",
            background: "#f4f4f4",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
