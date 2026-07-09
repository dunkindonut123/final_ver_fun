import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminPromotionStatus = "pending" | "approved" | "rejected" | "all";

export type AdminPromotionRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  flaggedById: string;
  flaggedByName: string;
  currentLevel: number;
  targetLevel: number;
  status: string;
  note: string | null;
  createdAt: string;
};

export function parsePromotionStatus(value: string | undefined | null): AdminPromotionStatus {
  if (value === "approved" || value === "rejected" || value === "all" || value === "pending") {
    return value;
  }
  return "pending";
}

export async function fetchAdminPromotions(
  db: SupabaseClient,
  status: AdminPromotionStatus = "pending"
): Promise<AdminPromotionRow[]> {
  let query = db
    .from("promotion_flags")
    .select("id, student_id, flagged_by, current_level, target_level, status, note, created_at")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: flags, error } = await query;
  if (error) throw new Error(error.message);
  if (!flags || flags.length === 0) return [];

  const studentIds = [...new Set(flags.map((f) => f.student_id))];
  const teacherIds = [...new Set(flags.map((f) => f.flagged_by))];

  const [{ data: students }, { data: teachers }] = await Promise.all([
    db.from("profiles").select("id, full_name, email").in("id", studentIds),
    db.from("profiles").select("id, full_name").in("id", teacherIds),
  ]);

  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));
  const teacherMap = new Map((teachers ?? []).map((t) => [t.id, t]));

  return flags.map((flag) => ({
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
}
