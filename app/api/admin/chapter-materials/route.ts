import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const [{ data: chapters, error: chaptersError }, { data: materials, error: materialsError }] =
    await Promise.all([
      auth.ctx.db
        .from("hsk_chapters")
        .select("id, title, hsk_level, chapter_number")
        .order("hsk_level", { ascending: true })
        .order("chapter_number", { ascending: true }),
      auth.ctx.db
        .from("chapter_materials")
        .select("chapter_id, file_name, file_size_bytes, updated_at"),
    ]);

  if (chaptersError) {
    return NextResponse.json({ error: chaptersError.message }, { status: 500 });
  }
  if (materialsError) {
    return NextResponse.json({ error: materialsError.message }, { status: 500 });
  }

  const materialMap = new Map((materials ?? []).map((row) => [row.chapter_id, row]));

  const result = (chapters ?? []).map((chapter) => {
    const material = materialMap.get(chapter.id);
    return {
      id: chapter.id,
      title: chapter.title,
      hskLevel: chapter.hsk_level,
      chapterNumber: chapter.chapter_number,
      material: material
        ? {
            fileName: material.file_name,
            fileSizeBytes: material.file_size_bytes,
            updatedAt: material.updated_at,
          }
        : null,
    };
  });

  return NextResponse.json({ chapters: result });
}
