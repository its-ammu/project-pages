export type TaskColor =
  | "5167F4"
  | "C89EF4"
  | "FFB9FA"
  | "FDEF5D"
  | "CD2C54"
  | "C2C2C2"
  | "none"
  | null;

export interface Project {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  color: TaskColor | string | null;
  completed: boolean;
  created_at: string;
  position: number;
  due_date?: string | null;
}

export const COLOR_OPTIONS = [
  { id: "none", bg: "transparent", border: "transparent", text: "#444", dot: "#ccc" },
  { id: "5167F4", bg: "#5167F4", border: "#5167F4", text: "#fff", dot: "#5167F4" },
  { id: "C89EF4", bg: "#C89EF4", border: "#C89EF4", text: "#000", dot: "#C89EF4" },
  { id: "FFB9FA", bg: "#FFB9FA", border: "#FFB9FA", text: "#000", dot: "#FFB9FA" },
  { id: "FDEF5D", bg: "#FDEF5D", border: "#FDEF5D", text: "#000", dot: "#FDEF5D" },
  { id: "CD2C54", bg: "#CD2C54", border: "#CD2C54", text: "#fff", dot: "#CD2C54" },
  { id: "C2C2C2", bg: "#C2C2C2", border: "#C2C2C2", text: "#000", dot: "#C2C2C2" },
] as const;

export function getColor(id: string | null) {
  return COLOR_OPTIONS.find((c) => c.id === (id ?? "none")) ?? COLOR_OPTIONS[0];
}
