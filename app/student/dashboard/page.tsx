import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboardContent } from "@/components/student/dashboard-content";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/signin");
  }

  if (profile.role !== "student") {
    redirect(profile.role === "teacher" ? "/teacher/dashboard" : "/signin");
  }

  const { data: studentProgress, error: studentError } = await supabase
    .from("students")
    .select("current_hsk_level, current_bab, current_pertemuan, teacher_id")
    .eq("user_id", user.id)
    .single();

  if (studentError || !studentProgress) {
    redirect("/signin");
  }

  let teacher: { name: string; email: string } | null = null;

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

  const student = {
    id: profile.id,
    name: profile.full_name ?? "Student",
    email: profile.email,
    current_hsk_level: studentProgress.current_hsk_level,
    current_bab: studentProgress.current_bab,
    current_pertemuan: studentProgress.current_pertemuan,
    teacher,
  };

  if (!student) {
    redirect("/signin");
  }

  return <StudentDashboardContent student={student} />;
}
