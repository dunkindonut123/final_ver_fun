import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboardContent } from "@/components/student/dashboard-content";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") {
    redirect(profile?.role === "teacher" ? "/teacher/dashboard" : profile?.role === "admin" ? "/admin/dashboard" : "/login");
  }

  const { data: studentProgress } = await supabase
    .from("students")
    .select("current_hsk_level, teacher_id, classroom_id")
    .eq("user_id", user.id)
    .single();

  if (!studentProgress) redirect("/login");

  let teacher: { name: string; email: string } | null = null;
  let classroom: { name: string } | null = null;

  if (studentProgress.teacher_id) {
    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", studentProgress.teacher_id)
      .single();

    if (teacherProfile) {
      teacher = {
        name: teacherProfile.full_name ?? "Teacher",
        email: teacherProfile.email,
      };
    }
  }

  if (studentProgress.classroom_id) {
    const { data: classroomRow } = await supabase
      .from("classrooms")
      .select("name")
      .eq("id", studentProgress.classroom_id)
      .single();

    if (classroomRow) {
      classroom = { name: classroomRow.name };
    }
  }

  return (
    <StudentDashboardContent
      student={{
        id: profile.id,
        name: profile.full_name ?? "Student",
        email: profile.email,
        current_hsk_level: studentProgress.current_hsk_level,
        teacher,
        classroom,
      }}
    />
  );
}
