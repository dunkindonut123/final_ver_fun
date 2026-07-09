import { getAdminPageContext } from "@/lib/admin/require-admin";
import { fetchAdminChapterMaterials } from "@/lib/admin/queries/chapter-materials";
import { AdminMaterialsContent } from "@/components/admin/admin-materials-content";

export default async function AdminMaterialsPage() {
  const { db } = await getAdminPageContext();
  const initialChapters = await fetchAdminChapterMaterials(db);

  return <AdminMaterialsContent initialChapters={initialChapters} />;
}
