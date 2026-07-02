import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { completeStudentAssignment } from "@/lib/lms/student-assignments";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentAssignmentId } = await params;
    const body = await request.json();
    const score = typeof body.score === "number" ? body.score : Number(body.score);

    if (Number.isNaN(score)) {
      return NextResponse.json({ error: "Score is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: row, error: fetchError } = await supabase
      .from("student_assignments")
      .select("id, student_id, is_locked")
      .eq("id", studentAssignmentId)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    if (row.student_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (row.is_locked) {
      return NextResponse.json({ error: "Assignment is locked." }, { status: 403 });
    }

    await completeStudentAssignment(supabase, studentAssignmentId, score);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
