import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassroomContent } from "@/components/teacher/classroom-content";
import { getClassroomStudentRows } from "@/lib/teacher/queries/classroom-students";

export default async function TeacherClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id, name, class_code, hsk_level, teacher_id")
    .eq("id", id)
    .single();

  if (!classroom || classroom.teacher_id !== user.id) redirect("/teacher/dashboard");

  const students = await getClassroomStudentRows(supabase, {
    classroomId: classroom.id,
    teacherId: user.id,
    hskLevel: classroom.hsk_level,
  });

  return (
    <ClassroomContent
      classroom={{
        id: classroom.id,
        name: classroom.name,
        class_code: classroom.class_code,
        hsk_level: classroom.hsk_level,
      }}
      teacherId={user.id}
      initialStudents={students}
    />
  );
}
