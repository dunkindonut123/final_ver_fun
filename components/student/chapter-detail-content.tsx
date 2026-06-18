"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StudentShell } from "@/components/layout/student-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChapterTabs } from "@/components/student/chapter-tabs";
import { ArrowLeft, CheckCircle2, ExternalLink, Lock, Play } from "lucide-react";

type AssignmentStatus = "locked" | "not_started" | "in_progress" | "completed";

interface AssignmentItem {
  studentAssignmentId: string;
  assignmentId: string;
  title: string;
  orderIndex: number;
  assignmentKey: string;
  isLocked: boolean;
  isCompleted: boolean;
  score: number | null;
  status: AssignmentStatus;
}

interface ChapterDetailContentProps {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string | null;
  hskLevel: number;
  studentId: string;
}

export function ChapterDetailContent({
  chapterId,
  chapterTitle,
  chapterDescription,
  hskLevel,
  studentId,
}: ChapterDetailContentProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("student_assignments")
        .select(
          "id, is_locked, is_completed, score, started_at, assignment:assignments(id, title, order_index, assignment_key, chapter_id)"
        )
        .eq("student_id", studentId);

      if (!data) {
        setLoading(false);
        return;
      }

      const items = data
        .map((row) => {
          const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
          if (!assignment || assignment.chapter_id !== chapterId) return null;

          const status: AssignmentStatus = row.is_locked
            ? "locked"
            : row.is_completed
              ? "completed"
              : row.started_at
                ? "in_progress"
                : "not_started";

          return {
            studentAssignmentId: row.id,
            assignmentId: assignment.id,
            title: assignment.title,
            orderIndex: assignment.order_index,
            assignmentKey: assignment.assignment_key,
            isLocked: row.is_locked,
            isCompleted: row.is_completed,
            score: row.score,
            status,
          } satisfies AssignmentItem;
        })
        .filter((item): item is AssignmentItem => item !== null)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      setAssignments(items);
      setLoading(false);
    };

    void load();
  }, [chapterId, studentId]);

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
          loading ? (
            <p className="text-muted-foreground">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-center text-muted-foreground">No assignments for this chapter yet.</p>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
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
                      {assignment.status === "completed" && assignment.score !== null ? (
                        <p className="mt-1 text-sm text-emerald-600">Score: {assignment.score}%</p>
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
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
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
              ))}
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
