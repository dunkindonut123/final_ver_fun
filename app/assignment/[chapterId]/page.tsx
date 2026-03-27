import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;

  if (!chapterId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/student/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <p className="mb-2 text-sm text-muted-foreground">Assignment Placeholder</p>
          <h1 className="text-2xl font-bold text-card-foreground">{chapterId}</h1>
          <p className="mt-4 text-muted-foreground">
            This assignment page is intentionally left blank for now.
          </p>
        </div>
      </div>
    </div>
  );
}
