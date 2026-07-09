import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { fetchAdminChapterMaterials } from "@/lib/admin/queries/chapter-materials";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const chapters = await fetchAdminChapterMaterials(auth.ctx.db);
    return NextResponse.json({ chapters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
