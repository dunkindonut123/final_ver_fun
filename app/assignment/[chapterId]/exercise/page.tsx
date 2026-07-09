import { redirect } from "next/navigation";

/** Legacy exercise URL — send players into the lock-aware student chapter flow. */
export default async function LegacyAssignmentExercisePage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
  searchParams?: Promise<{ assignment?: string; level?: string }>;
}) {
  const { chapterId } = await params;
  redirect(`/student/chapter/${chapterId}`);
}
