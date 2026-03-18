import { redirect } from "next/navigation";
import { StudentDashboardContent } from "@/components/student/dashboard-content";

export default async function StudentDashboard() {
  // TODO: replace with server auth check (e.g. Supabase getUser).
  const user = { id: "todo-user" };

  if (!user) {
    redirect("/signin");
  }

  // TODO: replace with DB query from students table joined with teachers table.
  const student = {
    id: "student-1",
    name: "Student Demo",
    email: "student@example.com",
    current_hsk_level: 1,
    current_bab: 1,
    current_pertemuan: 1,
    teacher: {
      name: "Teacher Demo",
      email: "teacher@example.com",
    },
  };

  if (!student) {
    redirect("/signin");
  }

  return <StudentDashboardContent student={student} />;
}
