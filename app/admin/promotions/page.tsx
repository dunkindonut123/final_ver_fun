import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminPromotionsContent } from "@/components/admin/admin-promotions-content";

export default async function AdminPromotionsPage() {
  await requireAdminPage();
  return <AdminPromotionsContent />;
}
