import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const supabase = createServerSupabaseClient(token);
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });

    if (projectsError) {
      console.error("[API] Projects error:", projectsError);
      return NextResponse.json(
        { error: projectsError.message },
        { status: 500 }
      );
    }

    if (!projects?.length) {
      return NextResponse.json({ projects: [] });
    }

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .in("project_id", projects.map((p) => p.id))
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (tasksError) {
      console.error("[API] Tasks error:", tasksError);
      return NextResponse.json(
        { error: tasksError.message },
        { status: 500 }
      );
    }

    const tasksByProject = (tasks ?? []).reduce<Record<string, typeof tasks>>(
      (acc, t) => {
        if (!acc[t.project_id]) acc[t.project_id] = [];
        acc[t.project_id].push(t);
        return acc;
      },
      {}
    );

    const result = projects.map((p) => ({
      ...p,
      tasks: tasksByProject[p.id] ?? [],
    }));

    return NextResponse.json({ projects: result });
  } catch (err) {
    console.error("[API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const body = await request.json();
    const { title } = body;
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title required" },
        { status: 400 }
      );
    }
    const supabase = createServerSupabaseClient(token);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: user.user.id, title })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: { ...data, tasks: [] } });
  } catch (err) {
    console.error("[API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
