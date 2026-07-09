import { getAdminPageContext } from "@/lib/admin/require-admin";
import { fetchAdminClassrooms } from "@/lib/admin/queries/classrooms";
import { fetchAdminStudents } from "@/lib/admin/queries/students";
import { fetchAdminTeachers } from "@/lib/admin/queries/teachers";
import { AdminClassroomsContent } from "@/components/admin/admin-classrooms-content";

export default async function AdminClassroomsPage() {
  const { db } = await getAdminPageContext();
  const [classrooms, students, teachers] = await Promise.all([
    fetchAdminClassrooms(db),
    fetchAdminStudents(db),
    fetchAdminTeachers(db),
  ]);

  const initialTeachers = teachers.filter((t) => t.status === "active");

  return (
    <AdminClassroomsContent
      initialClassrooms={classrooms}
      initialStudents={students}
      initialTeachers={initialTeachers}
    />
  );
}
