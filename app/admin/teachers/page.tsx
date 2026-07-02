import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminTeachersContent } from "@/components/admin/admin-teachers-content";

export default async function AdminTeachersPage() {
  await requireAdminPage();
  return <AdminTeachersContent />;
}
