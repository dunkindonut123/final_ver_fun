import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherDashboardContent } from "@/components/teacher/dashboard-content";

export default async function TeacherDashboardPage() {
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

  if (profile.role !== "teacher") {
    redirect(profile.role === "student" ? "/student/dashboard" : "/signin");
  }

  const { data: teacherRecord, error: teacherError } = await supabase
    .from("teachers")
    .select("teacher_code")
    .eq("user_id", user.id)
    .single();

  if (teacherError || !teacherRecord) {
    redirect("/signin");
  }

  return (
    <TeacherDashboardContent
      teacher={{
        id: profile.id,
        name: profile.full_name ?? "Teacher",
        email: profile.email,
        teacherCode: teacherRecord.teacher_code,
      }}
    />
  );
}
