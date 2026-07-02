import { redirect } from "next/navigation";

export default async function LegacyAssignmentPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  redirect(`/student/chapter/${chapterId}`);
}
