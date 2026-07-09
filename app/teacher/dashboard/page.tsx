import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherDashboardContent } from "@/components/teacher/dashboard-content";
import { getTeacherClassrooms } from "@/lib/teacher/queries/classrooms";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") {
    redirect(profile?.role === "student" ? "/student/dashboard" : "/login");
  }

  if (profile.status === "pending" || profile.status === "rejected") {
    redirect("/login");
  }

  const { data: teacherRecord } = await supabase
    .from("teachers")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!teacherRecord) redirect("/login");

  const classrooms = await getTeacherClassrooms(supabase, profile.id);

  return (
    <TeacherDashboardContent
      teacher={{
        id: profile.id,
        name: profile.full_name ?? "Teacher",
        email: profile.email,
      }}
      initialClassrooms={classrooms}
    />
  );
}
