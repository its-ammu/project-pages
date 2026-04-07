import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  const { id: taskId } = await params;
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const supabase = createServerSupabaseClient(token);
    const { count } = await supabase
      .from("subtasks")
      .select("*", { count: "exact", head: true })
      .eq("task_id", taskId);
    const position = typeof body.position === "number" ? body.position : (count ?? 0);
    const { data, error } = await supabase
      .from("subtasks")
      .insert({ task_id: taskId, title, position })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
