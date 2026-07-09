import { getAdminPageContext } from "@/lib/admin/require-admin";
import { fetchAdminClassrooms } from "@/lib/admin/queries/classrooms";
import {
  fetchAdminPromotions,
  parsePromotionStatus,
} from "@/lib/admin/queries/promotions";
import { AdminPromotionsContent } from "@/components/admin/admin-promotions-content";

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { db } = await getAdminPageContext();
  const params = await searchParams;
  const initialFilter = parsePromotionStatus(params.status);

  const [initialPromotions, classrooms] = await Promise.all([
    fetchAdminPromotions(db, initialFilter),
    fetchAdminClassrooms(db),
  ]);

  return (
    <AdminPromotionsContent
      initialPromotions={initialPromotions}
      initialClassrooms={classrooms}
      initialFilter={initialFilter}
    />
  );
}
