import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  return <AdminDashboardContent />;
}
