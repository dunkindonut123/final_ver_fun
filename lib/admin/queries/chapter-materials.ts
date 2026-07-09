import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminChapterMaterialRow = {
  id: string;
  title: string;
  hskLevel: number;
  chapterNumber: number;
  material: {
    fileName: string;
    fileSizeBytes: number;
    updatedAt: string;
  } | null;
};

export async function fetchAdminChapterMaterials(
  db: SupabaseClient
): Promise<AdminChapterMaterialRow[]> {
  const [{ data: chapters, error: chaptersError }, { data: materials, error: materialsError }] =
    await Promise.all([
      db
        .from("hsk_chapters")
        .select("id, title, hsk_level, chapter_number")
        .order("hsk_level", { ascending: true })
        .order("chapter_number", { ascending: true }),
      db.from("chapter_materials").select("chapter_id, file_name, file_size_bytes, updated_at"),
    ]);

  if (chaptersError) throw new Error(chaptersError.message);
  if (materialsError) throw new Error(materialsError.message);

  const materialMap = new Map((materials ?? []).map((row) => [row.chapter_id, row]));

  return (chapters ?? []).map((chapter) => {
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
}
