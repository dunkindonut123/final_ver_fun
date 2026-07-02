import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";

  let query = auth.ctx.db
    .from("promotion_flags")
    .select("id, student_id, flagged_by, current_level, target_level, status, note, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: flags, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!flags || flags.length === 0) {
    return NextResponse.json({ promotions: [] });
  }

  const studentIds = [...new Set(flags.map((f) => f.student_id))];
  const teacherIds = [...new Set(flags.map((f) => f.flagged_by))];

  const [{ data: students }, { data: teachers }] = await Promise.all([
    auth.ctx.db.from("profiles").select("id, full_name, email").in("id", studentIds),
    auth.ctx.db.from("profiles").select("id, full_name").in("id", teacherIds),
  ]);

  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));
  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));

  const result = flags.map((flag) => ({
    id: flag.id,
    studentId: flag.student_id,
    studentName: studentMap.get(flag.student_id)?.full_name ?? "Student",
    studentEmail: studentMap.get(flag.student_id)?.email ?? "",
    flaggedById: flag.flagged_by,
    flaggedByName: teacherMap.get(flag.flagged_by)?.full_name ?? "Teacher",
    currentLevel: flag.current_level,
    targetLevel: flag.target_level,
    status: flag.status,
    note: flag.note,
    createdAt: flag.created_at,
  }));

  return NextResponse.json({ promotions: result });
}
