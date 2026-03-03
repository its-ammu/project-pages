import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const body = await request.json();
    const { project_id, title, color, position, due_date } = body;
    if (!project_id || !title) {
      return NextResponse.json(
        { error: "project_id and title required" },
        { status: 400 }
      );
    }
    const supabase = createServerSupabaseClient(token);
    const insertData: Record<string, unknown> = {
      project_id,
      title,
      color: color ?? null,
      position: position ?? 0,
    };
    if (due_date !== undefined && due_date !== null && due_date !== "") {
      insertData.due_date = due_date;
    }
    const { data, error } = await supabase
      .from("tasks")
      .insert(insertData)
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
