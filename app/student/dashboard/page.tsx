import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboardContent } from "@/components/student/dashboard-content";

function buildChapterProgress(
  rows: { is_completed: boolean; assignment: { chapter_id: string } | { chapter_id: string }[] | null }[],
  hskLevel: number
): Record<string, { completed: number; total: number }> {
  const prefix = `hsk${hskLevel}-ch`;
  const progress: Record<string, { completed: number; total: number }> = {};

  for (const row of rows) {
    const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
    const chapterId = assignment?.chapter_id;
    if (!chapterId || !chapterId.startsWith(prefix)) continue;

    const current = progress[chapterId] ?? { completed: 0, total: 0 };
    current.total += 1;
    if (row.is_completed) current.completed += 1;
    progress[chapterId] = current;
  }

  return progress;
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: studentRow } = await supabase
    .from("students")
    .select(
      `
      current_hsk_level,
      profile:profiles!inner(id, email, full_name, role),
      classroom:classrooms(name),
      teacher:teachers!students_teacher_id_fkey(
        profile:profiles!teachers_user_id_fkey(full_name, email)
      ),
      student_assignments(
        is_completed,
        assignment:assignments!inner(chapter_id)
      )
    `
    )
    .eq("user_id", user.id)
    .single();

  const profile = Array.isArray(studentRow?.profile) ? studentRow.profile[0] : studentRow?.profile;
  if (!profile || profile.role !== "student") {
    redirect(
      profile?.role === "teacher"
        ? "/teacher/dashboard"
        : profile?.role === "admin"
          ? "/admin/dashboard"
          : "/login"
    );
  }

  if (!studentRow) redirect("/login");

  const classroom = Array.isArray(studentRow.classroom) ? studentRow.classroom[0] : studentRow.classroom;
  const teacherRow = Array.isArray(studentRow.teacher) ? studentRow.teacher[0] : studentRow.teacher;
  const teacherProfile = teacherRow
    ? Array.isArray(teacherRow.profile)
      ? teacherRow.profile[0]
      : teacherRow.profile
    : null;

  const assignmentRows = Array.isArray(studentRow.student_assignments)
    ? studentRow.student_assignments
    : studentRow.student_assignments
      ? [studentRow.student_assignments]
      : [];

  const chapterProgress = buildChapterProgress(assignmentRows, studentRow.current_hsk_level);

  return (
    <StudentDashboardContent
      student={{
        id: profile.id,
        name: profile.full_name ?? "Student",
        email: profile.email,
        current_hsk_level: studentRow.current_hsk_level,
        teacher: teacherProfile
          ? {
              name: teacherProfile.full_name ?? "Teacher",
              email: teacherProfile.email,
            }
          : null,
        classroom: classroom ? { name: classroom.name } : null,
      }}
      chapterProgress={chapterProgress}
    />
  );
}
