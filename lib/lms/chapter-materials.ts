import type { SupabaseClient } from "@supabase/supabase-js";

export const CHAPTER_MATERIALS_BUCKET = "chapter-materials";
export const CHAPTER_MATERIAL_MAX_BYTES = 20 * 1024 * 1024;

export interface ChapterMaterialRow {
  chapter_id: string;
  storage_path: string;
  file_name: string;
  file_size_bytes: number;
  updated_at: string;
  updated_by: string | null;
}

export function chapterMaterialStoragePath(chapterId: string): string {
  return `${chapterId}/material.pdf`;
}

export function isPdfFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  return mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function validateChapterMaterialFile(file: File): string | null {
  if (!isPdfFile(file)) {
    return "Only PDF files are allowed.";
  }
  if (file.size <= 0) {
    return "File is empty.";
  }
  if (file.size > CHAPTER_MATERIAL_MAX_BYTES) {
    return "PDF must be 20 MB or smaller.";
  }
  return null;
}

export async function chapterExists(
  db: SupabaseClient,
  chapterId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("hsk_chapters")
    .select("id")
    .eq("id", chapterId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function getChapterMaterial(
  db: SupabaseClient,
  chapterId: string
): Promise<ChapterMaterialRow | null> {
  const { data, error } = await db
    .from("chapter_materials")
    .select("chapter_id, storage_path, file_name, file_size_bytes, updated_at, updated_by")
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ChapterMaterialRow;
}

export async function uploadChapterMaterial(
  db: SupabaseClient,
  params: {
    chapterId: string;
    file: File;
    adminUserId: string;
  }
): Promise<{ material: ChapterMaterialRow } | { error: string }> {
  const validationError = validateChapterMaterialFile(params.file);
  if (validationError) {
    return { error: validationError };
  }

  const exists = await chapterExists(db, params.chapterId);
  if (!exists) {
    return { error: "Chapter not found." };
  }

  const storagePath = chapterMaterialStoragePath(params.chapterId);
  const fileBuffer = await params.file.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from(CHAPTER_MATERIALS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data, error: upsertError } = await db
    .from("chapter_materials")
    .upsert(
      {
        chapter_id: params.chapterId,
        storage_path: storagePath,
        file_name: params.file.name,
        file_size_bytes: params.file.size,
        updated_by: params.adminUserId,
      },
      { onConflict: "chapter_id" }
    )
    .select("chapter_id, storage_path, file_name, file_size_bytes, updated_at, updated_by")
    .single();

  if (upsertError || !data) {
    return { error: upsertError?.message ?? "Failed to save material metadata." };
  }

  return { material: data as ChapterMaterialRow };
}

export async function deleteChapterMaterial(
  db: SupabaseClient,
  chapterId: string
): Promise<{ success: true } | { error: string }> {
  const material = await getChapterMaterial(db, chapterId);
  if (!material) {
    return { error: "No material found for this chapter." };
  }

  const { error: storageError } = await db.storage
    .from(CHAPTER_MATERIALS_BUCKET)
    .remove([material.storage_path]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error: deleteError } = await db
    .from("chapter_materials")
    .delete()
    .eq("chapter_id", chapterId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  return { success: true };
}

export async function downloadChapterMaterialBytes(
  db: SupabaseClient,
  material: ChapterMaterialRow
): Promise<{ bytes: ArrayBuffer; fileName: string } | { error: string }> {
  const { data, error } = await db.storage
    .from(CHAPTER_MATERIALS_BUCKET)
    .download(material.storage_path);

  if (error || !data) {
    return { error: error?.message ?? "Material file not found in storage." };
  }

  return {
    bytes: await data.arrayBuffer(),
    fileName: material.file_name,
  };
}
