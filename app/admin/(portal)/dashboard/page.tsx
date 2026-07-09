import { getAdminPageContext } from "@/lib/admin/require-admin";
import { fetchAdminTeachers } from "@/lib/admin/queries/teachers";
import { fetchAdminPromotions } from "@/lib/admin/queries/promotions";
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content";

export default async function AdminDashboardPage() {
  const { db } = await getAdminPageContext();
  const [teachers, pendingPromotions] = await Promise.all([
    fetchAdminTeachers(db),
    fetchAdminPromotions(db, "pending"),
  ]);

  const pendingTeachers = teachers
    .filter((t) => t.status === "pending")
    .map((t) => ({
      id: t.id,
      name: t.full_name ?? "Teacher",
      email: t.email,
      createdAt: t.created_at,
    }));

  return (
    <AdminDashboardContent
      pendingTeachers={pendingTeachers}
      pendingPromotions={pendingPromotions}
    />
  );
}
