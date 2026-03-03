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
  const { id: projectId } = await params;
  try {
    const body = await request.json();
    const { taskIds } = body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds array required" },
        { status: 400 }
      );
    }
    const supabase = createServerSupabaseClient(token);
    for (let i = 0; i < taskIds.length; i++) {
      const { error } = await supabase
        .from("tasks")
        .update({ position: i })
        .eq("id", taskIds[i])
        .eq("project_id", projectId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
