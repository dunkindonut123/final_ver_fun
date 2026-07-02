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

  const [{ data: profile }, { data: studentProgress }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role").eq("id", user.id).single(),
    supabase
      .from("students")
      .select("current_hsk_level, teacher_id, classroom_id")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile || profile.role !== "student") {
    redirect(
      profile?.role === "teacher"
        ? "/teacher/dashboard"
        : profile?.role === "admin"
          ? "/admin/dashboard"
          : "/login"
    );
  }

  if (!studentProgress) redirect("/login");

  const [{ data: teacherProfile }, { data: classroomRow }, { data: progressRows }] =
    await Promise.all([
      studentProgress.teacher_id
        ? supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", studentProgress.teacher_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      studentProgress.classroom_id
        ? supabase
            .from("classrooms")
            .select("name")
            .eq("id", studentProgress.classroom_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("student_assignments")
        .select("is_completed, assignment:assignments(chapter_id)")
        .eq("student_id", user.id),
    ]);

  const chapterProgress = buildChapterProgress(progressRows ?? [], studentProgress.current_hsk_level);

  return (
    <StudentDashboardContent
      student={{
        id: profile.id,
        name: profile.full_name ?? "Student",
        email: profile.email,
        current_hsk_level: studentProgress.current_hsk_level,
        teacher: teacherProfile
          ? {
              name: teacherProfile.full_name ?? "Teacher",
              email: teacherProfile.email,
            }
          : null,
        classroom: classroomRow ? { name: classroomRow.name } : null,
      }}
      chapterProgress={chapterProgress}
    />
  );
}
