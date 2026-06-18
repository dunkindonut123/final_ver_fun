import { redirect } from "next/navigation";

export default async function LegacyAssignmentExercisePage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>;
  searchParams?: Promise<{ assignment?: string; level?: string }>;
}) {
  const { chapterId } = await params;
  const query = searchParams ? await searchParams : {};
  const assignment = (query.assignment ?? "A1").toUpperCase();
  const level = query.level ?? "1";

  if (assignment === "B") {
    redirect(`/typing-hanzi?legacy=b&chapterId=${chapterId}`);
  }

  redirect(`/typing-hanzi?hsk=${level}&assignment=${assignment}&chapterId=${chapterId}`);
}
