import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterDetailContent } from "@/components/student/chapter-detail-content";

export default async function StudentChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chapterId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") redirect("/login");

  const { data: chapter } = await supabase
    .from("hsk_chapters")
    .select("id, title, hsk_level, description")
    .eq("id", chapterId)
    .single();

  if (!chapter) redirect("/student/dashboard");

  const { data: student } = await supabase
    .from("students")
    .select("current_hsk_level")
    .eq("user_id", user.id)
    .single();

  if (!student || student.current_hsk_level !== chapter.hsk_level) {
    redirect("/student/dashboard");
  }

  return (
    <ChapterDetailContent
      chapterId={chapter.id}
      chapterTitle={chapter.title}
      chapterDescription={chapter.description ?? null}
      hskLevel={chapter.hsk_level}
      studentId={user.id}
    />
  );
}
