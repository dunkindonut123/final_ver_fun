"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { MandarinTypingGame } from "@/components/mandarin-typing-game";
import { isAssignmentALevel, type MandarinTypingQuestion } from "@/lib/mandarin-typing-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionsUnavailable } from "@/components/student/questions-unavailable";
import { ArrowLeft } from "lucide-react";

const AssignmentBGame = dynamic(
  () => import("@/components/assignment-b-game").then((m) => m.AssignmentBGame),
  { ssr: false }
);

interface AssignmentGameRouterProps {
  studentAssignmentId: string;
  chapterId: string;
  hskLevel: number;
  assignmentKey: string;
  assignmentTitle: string;
  isLocked: boolean;
  isCompleted: boolean;
  mandarinQuestions?: MandarinTypingQuestion[];
  assignmentBWords?: string[];
}

export function AssignmentGameRouter({
  studentAssignmentId,
  chapterId,
  hskLevel,
  assignmentKey,
  assignmentTitle,
  isLocked,
  isCompleted,
  mandarinQuestions,
  assignmentBWords,
}: AssignmentGameRouterProps) {
  const returnHref = `/student/chapter/${chapterId}`;

  if (isLocked) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md rounded-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold">Assignment Locked</h1>
            <p className="mt-2 text-muted-foreground">Your teacher has not unlocked this assignment yet.</p>
            <Button asChild className="mt-6 rounded-xl">
              <Link href={returnHref}>Back to chapter</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (assignmentKey === "B") {
    if (!assignmentBWords?.length) {
      return <QuestionsUnavailable returnHref={returnHref} />;
    }

    return (
      <div>
        <div className="border-b border-border bg-background px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link href={returnHref} className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {assignmentTitle}
            </Link>
            {isCompleted ? (
              <span className="text-sm text-emerald-600">Completed</span>
            ) : null}
          </div>
        </div>
        <AssignmentBGame
          chapterId={chapterId}
          initialWordPool={assignmentBWords}
          returnHref={returnHref}
        />
      </div>
    );
  }

  if (isAssignmentALevel(assignmentKey)) {
    if (!mandarinQuestions?.length) {
      return <QuestionsUnavailable returnHref={returnHref} />;
    }

    return (
      <MandarinTypingGame
        hskLevel={hskLevel}
        assignmentLevel={assignmentKey}
        chapterId={chapterId}
        studentAssignmentId={studentAssignmentId}
        returnHref={returnHref}
        initialQuestions={mandarinQuestions}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p className="text-muted-foreground">Unsupported assignment type.</p>
    </main>
  );
}
