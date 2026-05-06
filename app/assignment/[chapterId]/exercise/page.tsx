import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssignmentExerciseClient } from "@/components/student/assignment-exercise";

export default async function ExercisePlaceholderPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>;
  searchParams?: Promise<{ assignment?: string; level?: string }>;
}) {
  const { chapterId } = await params;
  const query = searchParams ? await searchParams : {};

  if (!chapterId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/assignment/${chapterId}`}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chapter
        </Link>

        <AssignmentExerciseClient
          chapterId={chapterId}
          assignment={query.assignment === "B" ? "B" : "A"}
          level={query.level ? Number(query.level) : undefined}
        />
      </div>
    </div>
  );
}