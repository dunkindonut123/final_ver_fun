import type { SupabaseClient } from "@supabase/supabase-js";

export async function canAccessChapterMaterial(
  db: SupabaseClient,
  userId: string,
  chapterId: string
): Promise<boolean> {
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile) return false;
  if (profile.role === "admin") return true;

  if (profile.role !== "student") return false;

  const [{ data: student }, { data: chapter }] = await Promise.all([
    db.from("students").select("current_hsk_level").eq("user_id", userId).single(),
    db.from("hsk_chapters").select("hsk_level").eq("id", chapterId).single(),
  ]);

  if (!student || !chapter) return false;
  return student.current_hsk_level === chapter.hsk_level;
}
