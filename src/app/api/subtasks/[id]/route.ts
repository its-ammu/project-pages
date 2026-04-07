import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  const { id } = await params;
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient(token);
    const allowedKeys = ["title", "completed", "position"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (key in body) {
        if (key === "title" && typeof body.title === "string") {
          const t = body.title.trim();
          if (!t) {
            return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
          }
          updates.title = t;
        } else {
          updates[key] = body[key];
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("subtasks")
      .update(updates)
      .eq("id", id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  const { id } = await params;
  try {
    const supabase = createServerSupabaseClient(token);
    const { error } = await supabase.from("subtasks").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
