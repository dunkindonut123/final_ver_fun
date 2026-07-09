import { requireAdminPage } from "@/lib/admin/require-admin";
import { AdminQuestionsContent } from "@/components/admin/admin-questions-content";

export default async function AdminQuestionsPage() {
  await requireAdminPage();
  return <AdminQuestionsContent />;
}
