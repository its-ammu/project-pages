"use client";

import { useState, useEffect, useRef } from "react";

interface ThemedDatePickerProps {
  value: string;
  onChange: (isoDate: string | null) => void;
  placeholder?: string;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIso(y: number, monthIndex: number, day: number) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseIso(s: string): { y: number; m: number; d: number } | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [ys, ms, ds] = s.split("-");
  const y = Number(ys);
  const m = Number(ms) - 1;
  const d = Number(ds);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  return { y, m, d };
}

function formatDisplay(iso: string) {
  const p = parseIso(iso);
  if (!p) return "";
  try {
    const date = new Date(p.y, p.m, p.d);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function ThemedDatePicker({
  value,
  onChange,
  placeholder = "Due date",
}: ThemedDatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const parsed = parseIso(value);
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const [viewY, setViewY] = useState(parsed?.y ?? todayY);
  const [viewM, setViewM] = useState(parsed?.m ?? todayM);

  useEffect(() => {
    if (parsed) {
      setViewY(parsed.y);
      setViewM(parsed.m);
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const startWeekday = new Date(viewY, viewM, 1).getDay();
  const blanks = Array.from({ length: startWeekday }, (_, i) => (
    <div key={`b-${i}`} style={{ aspectRatio: "1", minHeight: 32 }} />
  ));
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const iso = toIso(viewY, viewM, day);
    const isSelected = value === iso;
    const isToday = viewY === todayY && viewM === todayM && day === todayD;
    return (
      <button
        key={day}
        type="button"
        onClick={() => {
          onChange(iso);
          setOpen(false);
        }}
        style={{
          aspectRatio: "1",
          minHeight: 32,
          border: "none",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: isSelected ? 600 : 500,
          cursor: "pointer",
          background: isSelected ? "#222" : "transparent",
          color: isSelected ? "#fff" : "#444",
          boxShadow: isToday && !isSelected ? "inset 0 0 0 1px #ddd" : "none",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (!isSelected) el.style.background = "#f0f0f0";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = isSelected ? "#222" : "transparent";
        }}
      >
        {day}
      </button>
    );
  });

  const monthLabel = new Date(viewY, viewM, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const goPrev = () => {
    if (viewM === 0) {
      setViewM(11);
      setViewY((y) => y - 1);
    } else {
      setViewM((m) => m - 1);
    }
  };
  const goNext = () => {
    if (viewM === 11) {
      setViewM(0);
      setViewY((y) => y + 1);
    } else {
      setViewM((m) => m + 1);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          fontSize: 12,
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          background: "#fff",
          color: value ? "#444" : "#bbb",
          cursor: "pointer",
          fontFamily: "inherit",
          fontWeight: 500,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {value ? formatDisplay(value) : placeholder}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 6,
            zIndex: 1002,
            minWidth: 260,
            padding: 12,
            background: "#fff",
            border: "1px solid #ebebeb",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={goPrev}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: "4px 8px",
                color: "#888",
                fontSize: 14,
              }}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{monthLabel}</span>
            <button
              type="button"
              onClick={goNext}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: "4px 8px",
                color: "#888",
                fontSize: 14,
              }}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 2,
              marginBottom: 4,
            }}
          >
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#aaa",
                  textAlign: "center",
                  padding: "2px 0",
                  letterSpacing: "0.02em",
                }}
              >
                {w}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 2,
            }}
          >
            {blanks}
            {days}
          </div>
        </div>
      )}
    </div>
  );
}
