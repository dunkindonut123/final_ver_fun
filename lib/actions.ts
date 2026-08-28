import { createClient } from "@/lib/supabase/client";
import { chapterIdsForHsk } from "@/lib/lms/hsk-chapters";

interface Chapter {
  id: string;
  hsk_level: number;
  chapter_number: number;
}

async function getChapterIdsForLevel(level: number): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hsk_chapters")
    .select("id, hsk_level, chapter_number")
    .eq("hsk_level", level)
    .order("chapter_number", { ascending: true });

  if (error || !data || data.length === 0) {
    return chapterIdsForHsk(level);
  }

  return (data as Chapter[]).map((chapter) => chapter.id);
}

export async function unlockChapterForStudent(studentId: string, chapterId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("student_chapter_access").upsert(
    {
      student_id: studentId,
      chapter_id: chapterId,
      is_unlocked: true,
    },
    {
      onConflict: "student_id,chapter_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function lockChapterForStudent(studentId: string, chapterId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("student_chapter_access").upsert(
    {
      student_id: studentId,
      chapter_id: chapterId,
      is_unlocked: false,
    },
    {
      onConflict: "student_id,chapter_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function unlockHSKLevelForStudent(studentId: string, level: number) {
  const chapterIds = await getChapterIdsForLevel(level);
  await Promise.all(chapterIds.map((chapterId) => unlockChapterForStudent(studentId, chapterId)));
}

export async function lockHSKLevelForStudent(studentId: string, level: number) {
  const chapterIds = await getChapterIdsForLevel(level);
  await Promise.all(chapterIds.map((chapterId) => lockChapterForStudent(studentId, chapterId)));
}
