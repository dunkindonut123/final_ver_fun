import { getAdminPageContext } from "@/lib/admin/require-admin";
import { fetchAdminTeachers } from "@/lib/admin/queries/teachers";
import { AdminTeachersContent } from "@/components/admin/admin-teachers-content";

export default async function AdminTeachersPage() {
  const { db } = await getAdminPageContext();
  const initialTeachers = await fetchAdminTeachers(db);

  return <AdminTeachersContent initialTeachers={initialTeachers} />;
}
