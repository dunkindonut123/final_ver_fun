import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminStudentsContent } from "@/components/admin/admin-students-content";

export default async function AdminStudentsPage() {
  await requireAdminPage();
  return <AdminStudentsContent />;
}
