"use client";

import { useMemo } from "react";
import { COLOR_OPTIONS } from "@/types";
import type { Project, Task } from "@/types";
import { projectProgressUnits, isTaskDoneForDisplay } from "@/lib/taskProgress";

interface StatsPanelProps {
  projects: (Project & { tasks: Task[] })[];
}

export function StatsPanel({ projects }: StatsPanelProps) {
  const allTasks = projects.flatMap((p) => p.tasks ?? []);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => isTaskDoneForDisplay(t)).length;

  const { done: doneUnits, total: totalUnits } = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const p of projects) {
      const u = projectProgressUnits(p);
      done += u.done;
      total += u.total;
    }
    return { done, total };
  }, [projects]);

  const pct = totalUnits ? Math.round((doneUnits / totalUnits) * 100) : 0;

  const colorCounts = useMemo(() => {
    return COLOR_OPTIONS.filter((c) => c.id !== "none").map((c) => ({
      ...c,
      count: allTasks.filter(
        (t) => (t.color ?? "none") === c.id
      ).length,
    }));
  }, [allTasks]);

  const maxCount = Math.max(...colorCounts.map((c) => c.count), 1);

  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  if (totalTasks === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "56px 20px",
        }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 16 }}>
          <rect x="6" y="10" width="14" height="28" rx="2" stroke="#ddd" strokeWidth="1.5" />
          <rect x="6" y="24" width="14" height="14" rx="0" fill="#f0f0f0" />
          <rect x="24" y="6" width="14" height="32" rx="2" stroke="#ddd" strokeWidth="1.5" />
          <rect x="24" y="18" width="14" height="20" rx="0" fill="#f0f0f0" />
          <line x1="44" y1="38" x2="4" y2="38" stroke="#e8e8e8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 14, color: "#aaa", fontWeight: 500, marginBottom: 4 }}>
          No stats yet
        </span>
        <span style={{ fontSize: 12, color: "#ccc" }}>
          Add projects and tasks to see your progress here.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { label: "Total Tasks", value: totalTasks },
          { label: "Completed", value: doneTasks },
          { label: "Remaining", value: totalTasks - doneTasks },
          { label: "Projects", value: projects.length },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              border: "1px solid #ebebeb",
              borderRadius: 12,
              padding: "18px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-1px",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #ebebeb",
            borderRadius: 14,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#aaa",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              alignSelf: "flex-start",
            }}
          >
            Completion
          </div>
          <svg width={100} height={100} viewBox="0 0 100 100">
            <circle
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth={10}
            />
            <circle
              cx={50}
              cy={50}
              r={r}
              fill="none"
              stroke="#222"
              strokeWidth={10}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 0.5s" }}
            />
            <text
              x={50}
              y={55}
              textAnchor="middle"
              fontSize={16}
              fontWeight={700}
              fill="#222"
            >
              {pct}%
            </text>
          </svg>
          <div style={{ fontSize: 12, color: "#aaa" }}>
            {doneUnits} of {totalUnits} done
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #ebebeb",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#aaa",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 16,
            }}
          >
            Tasks by Color
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {colorCounts.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c.dot,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: "#f5f5f5",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(c.count / maxCount) * 100}%`,
                      background: c.dot,
                      borderRadius: 4,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "#bbb",
                    width: 16,
                    textAlign: "right",
                  }}
                >
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #ebebeb",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#aaa",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 16,
          }}
        >
          Per Project
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projects.map((proj) => {
            const { done: d, total: tot } = projectProgressUnits(proj);
            const p = tot ? Math.round((d / tot) * 100) : 0;
            return (
              <div key={proj.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {proj.title}
                  </span>
                  <span style={{ fontSize: 12, color: "#aaa" }}>
                    {d}/{tot}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "#f0f0f0",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${p}%`,
                      background: "#222",
                      borderRadius: 4,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
