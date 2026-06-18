import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminClassroomsContent } from "@/components/admin/admin-classrooms-content";

export default async function AdminClassroomsPage() {
  await requireAdminPage();
  return <AdminClassroomsContent />;
}
