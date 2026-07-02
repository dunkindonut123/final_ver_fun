import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDetailContent } from "@/components/teacher/student-detail-content";

export default async function TeacherStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") redirect("/login");

  const { data: studentRow } = await supabase
    .from("students")
    .select("user_id, current_hsk_level, classroom_id, teacher_id")
    .eq("user_id", studentId)
    .single();

  if (!studentRow || studentRow.teacher_id !== user.id) redirect("/teacher/dashboard");

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", studentId)
    .single();

  let classroomName: string | null = null;
  if (studentRow.classroom_id) {
    const { data: classroom } = await supabase
      .from("classrooms")
      .select("name")
      .eq("id", studentRow.classroom_id)
      .single();

    classroomName = classroom?.name ?? null;
  }

  return (
    <StudentDetailContent
      student={{
        id: studentId,
        name: studentProfile?.full_name ?? "Student",
        email: studentProfile?.email ?? "",
        hskLevel: studentRow.current_hsk_level,
        classroomName,
      }}
    />
  );
}
