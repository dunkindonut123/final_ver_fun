import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: teacherId } = await params;

    const { data: profile, error: profileError } = await auth.ctx.db
      .from("profiles")
      .select("id, role")
      .eq("id", teacherId)
      .single();

    if (profileError || !profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // classrooms.teacher_id → ON DELETE SET NULL (after migration)
    // students.teacher_id → ON DELETE SET NULL
    // Student accounts and classrooms remain for admin reassignment.
    const { error: deleteError } = await auth.ctx.db.auth.admin.deleteUser(teacherId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
