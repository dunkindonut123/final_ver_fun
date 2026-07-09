import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { uploadChapterMaterial } from "@/lib/lms/chapter-materials";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const chapterId = formData.get("chapterId");
    const file = formData.get("file");

    if (typeof chapterId !== "string" || !chapterId.trim()) {
      return NextResponse.json({ error: "Chapter is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    const result = await uploadChapterMaterial(auth.ctx.db, {
      chapterId: chapterId.trim(),
      file,
      adminUserId: auth.ctx.userId,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      material: {
        chapterId: result.material.chapter_id,
        fileName: result.material.file_name,
        fileSizeBytes: result.material.file_size_bytes,
        updatedAt: result.material.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
