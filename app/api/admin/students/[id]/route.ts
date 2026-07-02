import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: studentId } = await params;

    const { data: profile, error: profileError } = await auth.ctx.db
      .from("profiles")
      .select("id, role")
      .eq("id", studentId)
      .single();

    if (profileError || !profile || profile.role !== "student") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { error: deleteError } = await auth.ctx.db.auth.admin.deleteUser(studentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
