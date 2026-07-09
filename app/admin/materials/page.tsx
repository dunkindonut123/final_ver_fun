import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminMaterialsContent } from "@/components/admin/admin-materials-content";

export default async function AdminMaterialsPage() {
  await requireAdminPage();
  return <AdminMaterialsContent />;
}
