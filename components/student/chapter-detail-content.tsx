"use client";

import Link from "next/link";
import { StudentShell } from "@/components/layout/student-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChapterTabs } from "@/components/student/chapter-tabs";
import { AssignmentRetryButton } from "@/components/student/assignment-retry-button";
import { formatAAssignmentScoreDisplay } from "@/lib/lms/assignment-score-display";
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions";
import { ArrowLeft, CheckCircle2, ExternalLink, Lock, Play } from "lucide-react";

type AssignmentStatus = "locked" | "not_started" | "in_progress" | "completed";

export interface ChapterAssignmentItem {
  studentAssignmentId: string;
  assignmentId: string;
  title: string;
  orderIndex: number;
  assignmentKey: string;
  isLocked: boolean;
  isCompleted: boolean;
  score: number | null;
  correctCount: number | null;
  totalQuestions: number | null;
  questionPoolCount: number | null;
  status: AssignmentStatus;
}

interface ChapterDetailContentProps {
  chapterTitle: string;
  chapterDescription: string | null;
  hskLevel: number;
  assignments: ChapterAssignmentItem[];
}

export function ChapterDetailContent({
  chapterTitle,
  chapterDescription,
  hskLevel,
  assignments,
}: ChapterDetailContentProps) {
  return (
    <StudentShell>
      <Link
        href="/student/dashboard"
        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground/70 hover:bg-foreground/10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mb-8">
        <Badge className="mb-3 rounded-full bg-[#1e5fa8] text-white">HSK {hskLevel}</Badge>
        <h1 className="text-3xl font-bold text-foreground">{chapterTitle}</h1>
        <p className="mt-2 text-muted-foreground">
          {chapterDescription ?? "Complete assignments unlocked by your teacher"}
        </p>
      </div>

      <ChapterTabs
        assignmentsContent={
          assignments.length === 0 ? (
            <p className="text-center text-muted-foreground">No assignments for this chapter yet.</p>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => {
                const scoreDisplay =
                  assignment.score !== null && assignment.status !== "locked"
                    ? isAssignmentALevel(assignment.assignmentKey)
                      ? formatAAssignmentScoreDisplay(
                          assignment.score,
                          assignment.correctCount,
                          assignment.totalQuestions,
                          assignment.questionPoolCount
                        )
                      : `${assignment.score}%`
                    : null;

                return (
                <Card
                  key={assignment.studentAssignmentId}
                  className={`rounded-2xl border ${
                    assignment.isLocked
                      ? "border-border bg-muted/40 opacity-80"
                      : "border-white/20 bg-background/75 shadow-lg shadow-foreground/5"
                  }`}
                >
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Assignment {assignment.orderIndex}</p>
                      <h2 className="text-lg font-semibold text-foreground">{assignment.title}</h2>
                      {scoreDisplay ? (
                        <p
                          className={`mt-1 text-sm ${
                            assignment.status === "completed" ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          {assignment.status === "completed" ? "Score" : "Last score"}: {scoreDisplay}
                        </p>
                      ) : assignment.status === "in_progress" ? (
                        <p className="mt-1 text-sm text-amber-600">In progress</p>
                      ) : null}
                    </div>

                    {assignment.status === "locked" ? (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        Locked by teacher
                      </div>
                    ) : assignment.status === "completed" ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Completed
                          </div>
                          <AssignmentRetryButton studentAssignmentId={assignment.studentAssignmentId} />
                        </div>
                      </div>
                    ) : (
                      <Button asChild className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]">
                        <Link href={`/student/assignment/${assignment.studentAssignmentId}`}>
                          <Play className="mr-2 h-4 w-4" />
                          {assignment.status === "in_progress" ? "Continue" : "Start"}
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )
        }
        materialsContent={
          <div className="py-4 text-center">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Chapter materials</h2>
            <p className="mb-6 text-muted-foreground">
              Study guides and reference materials for {chapterTitle} will appear here.
            </p>
            <Button asChild variant="outline" className="rounded-xl">
              <a href="#" onClick={(e) => e.preventDefault()}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View materials (coming soon)
              </a>
            </Button>
          </div>
        }
      />
    </StudentShell>
  );
}
