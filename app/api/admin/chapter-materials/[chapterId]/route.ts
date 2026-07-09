import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { deleteChapterMaterial } from "@/lib/lms/chapter-materials";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { chapterId } = await params;
  const result = await deleteChapterMaterial(auth.ctx.db, chapterId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
