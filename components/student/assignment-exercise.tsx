"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ASSIGNMENT_STEPS,
  completedAssignmentsToScore,
  isAssignmentUnlocked,
  scoreToCompletedAssignments,
  summaryFromChapterProgress,
  type AssignmentKey,
} from "@/lib/assignment-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Loader2, Lock } from "lucide-react";

interface AssignmentExerciseClientProps {
  chapterId: string;
  assignment: "A" | "B";
  level?: number;
}

function resolveStepKey(assignment: "A" | "B", level?: number): AssignmentKey {
  if (assignment === "B") {
    return "B";
  }

  if (level === 2) {
    return "A2";
  }

  if (level === 3) {
    return "A3";
  }

  return "A1";
}

export function AssignmentExerciseClient({ chapterId, assignment, level }: AssignmentExerciseClientProps) {
  const stepKey = useMemo(() => resolveStepKey(assignment, level), [assignment, level]);
  const [completedAssignments, setCompletedAssignments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const summary = useMemo(
    () => summaryFromChapterProgress(completedAssignments * 25),
    [completedAssignments]
  );
  const isUnlocked = isAssignmentUnlocked(stepKey, summary);
  const stepIndex = ASSIGNMENT_STEPS.findIndex((step) => step.key === stepKey);
  const isCompleted = completedAssignments > stepIndex;
  const stepConfig = ASSIGNMENT_STEPS.find((step) => step.key === stepKey);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setStatusMessage("Please sign in to continue.");
          return;
        }

        const { data } = await supabase
          .from("student_chapter_progress")
          .select("chapter_id, score, is_completed, time_spent_minutes, last_accessed")
          .eq("student_id", userData.user.id)
          .eq("chapter_id", chapterId)
          .maybeSingle();

        setCompletedAssignments(scoreToCompletedAssignments(data?.score ?? null));
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [chapterId]);

  const handleComplete = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setStatusMessage("Please sign in to continue.");
        return;
      }

      if (!isUnlocked) {
        setStatusMessage("Complete the previous exercise first.");
        return;
      }

      const nextCompletedCount = Math.max(
        summary.completedCount,
        ASSIGNMENT_STEPS.findIndex((step) => step.key === stepKey) + 1
      );

      const { error } = await supabase.from("student_chapter_progress").upsert(
        {
          student_id: userData.user.id,
          chapter_id: chapterId,
          score: completedAssignmentsToScore(nextCompletedCount),
          is_completed: nextCompletedCount === ASSIGNMENT_STEPS.length,
          time_spent_minutes: 0,
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: "student_id,chapter_id",
        }
      );

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      setCompletedAssignments(nextCompletedCount);

      setStatusMessage("Exercise marked complete.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border bg-card p-8 shadow-sm">
      <CardContent className="space-y-6 p-0">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1e5fa8]/10 px-3 py-1 text-sm font-medium text-[#1e5fa8]">
          <BookOpen className="h-4 w-4" />
          Exercise coming soon
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {stepConfig ? stepConfig.label : "Exercise"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            This is a placeholder exercise page for {chapterId}. The real exercise content will be
            added here later.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge className="rounded-full bg-[#1e5fa8] text-white">
            {summary.completedCount}/{summary.totalCount} complete
          </Badge>
          <span>{isUnlocked ? "Unlocked" : "Locked"}</span>
          {isCompleted ? <span className="text-emerald-600">Already completed</span> : null}
        </div>

        {statusMessage ? (
          <div className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">
            {statusMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleComplete}
            disabled={loading || saving || !isUnlocked || isCompleted}
            className="rounded-xl"
          >
            {loading || saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : !isUnlocked ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Locked
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              <>Mark Complete</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}