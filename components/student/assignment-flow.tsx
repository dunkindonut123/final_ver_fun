"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { CheckCircle2, Lock } from "lucide-react";

interface AssignmentFlowProps {
  chapterId: string;
}

interface ChapterInfo {
  hskLevel: number | null;
  chapterNumber: number | null;
}

function parseChapterInfo(chapterId: string): ChapterInfo {
  const match = chapterId.match(/^hsk(\d+)-ch(\d+)$/i);

  if (!match) {
    return {
      hskLevel: null,
      chapterNumber: null,
    };
  }

  return {
    hskLevel: Number(match[1]),
    chapterNumber: Number(match[2]),
  };
}

export function AssignmentFlow({ chapterId }: AssignmentFlowProps) {
  const router = useRouter();
  const [completedAssignments, setCompletedAssignments] = useState(0);
  const [loading, setLoading] = useState(true);

  const chapterInfo = useMemo(() => parseChapterInfo(chapterId), [chapterId]);
  const summary = useMemo(
    () => summaryFromChapterProgress(completedAssignments * 20),
    [completedAssignments]
  );
  const isAssignmentBUnlocked = isAssignmentUnlocked("B", summary);
  const stepStates = useMemo(() => {
    return ASSIGNMENT_STEPS.map((step) => {
      const stepIndex = ASSIGNMENT_STEPS.findIndex((item) => item.key === step.key);

      return {
        ...step,
        isCompleted: completedAssignments > stepIndex,
        isUnlocked: isAssignmentUnlocked(step.key, summary),
      };
    });
  }, [completedAssignments, summary]);

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setCompletedAssignments(0);
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-[#1e5fa8]/5 via-background to-[#f9a825]/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Assignment for</p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {chapterInfo.hskLevel !== null && chapterInfo.chapterNumber !== null
                ? `HSK ${chapterInfo.hskLevel} - Chapter ${chapterInfo.chapterNumber}`
                : chapterId}
            </h2>
          </div>
          <Badge className="w-fit rounded-full bg-[#1e5fa8] text-white">
            {summary.completedCount}/{summary.totalCount} assignments complete
          </Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Finish Assignment A levels in order to unlock the final Assignment B.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Assignment A</h3>
            <p className="text-sm text-muted-foreground">
              Complete the four levels in sequence to unlock Assignment B.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            {summary.completedKeys.includes("A4") ? "B unlocked" : "B locked"}
          </Badge>
        </div>

        <div className="grid gap-4">
          {stepStates.filter((step) => step.key !== "B").map((step, index) => {
            const levelNumber = index + 1;

            return (
              <Card key={`assignment-a-${levelNumber}`} className="rounded-2xl border-border/80">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-card-foreground">
                        {step.label}
                      </h4>
                      {step.isCompleted ? (
                        <Badge className="rounded-full bg-emerald-500 text-white">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Complete
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Open the exercise placeholder for level {levelNumber}. This will be replaced
                      with the real exercise flow.
                    </p>
                  </div>

                  {step.isUnlocked ? (
                    <a
                      role="button"
                      onClick={() =>
                        router.push(
                          `/typing-hanzi?hsk=${chapterInfo.hskLevel ?? 1}&assignment=A${levelNumber}&chapterId=${encodeURIComponent(
                            chapterId
                          )}`
                        )
                      }
                      href={`/typing-hanzi?hsk=${chapterInfo.hskLevel ?? 1}&assignment=A${levelNumber}&chapterId=${encodeURIComponent(
                        chapterId
                      )}`}
                      className={`inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 sm:min-w-[180px] rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        step.isCompleted
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {step.isCompleted ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Review Hanzi Game
                        </>
                      ) : (
                        <>Open Hanzi Game</>
                      )}
                    </a>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      className="w-full sm:w-auto min-h-11 sm:min-w-[180px] rounded-xl"
                      variant="secondary"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Complete previous level
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Assignment B</h3>
            <p className="text-sm text-muted-foreground">
              The final assignment unlocks only after all four Assignment A levels are complete.
            </p>
          </div>
          <Badge
            className={isAssignmentBUnlocked ? "rounded-full bg-emerald-500 text-white" : "rounded-full"}
            variant={isAssignmentBUnlocked ? undefined : "secondary"}
          >
            {isAssignmentBUnlocked ? "Unlocked" : "Locked"}
          </Badge>
        </div>

        <Card className="mt-3 rounded-2xl border-border/80">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-base font-semibold text-card-foreground">
                Final Assignment B
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAssignmentBUnlocked
                  ? "Open the final exercise placeholder for Assignment B."
                  : "Complete Assignment A Level 4 to unlock this final task."}
              </p>
            </div>

            {isAssignmentBUnlocked ? (
              <a
                role="button"
                onClick={() => router.push(`/assignment/${chapterId}/exercise?assignment=B`)}
                href={`/assignment/${chapterId}/exercise?assignment=B`}
                className="inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 sm:min-w-[180px] rounded-xl px-4 py-2.5 text-sm font-medium transition-colors bg-primary text-primary-foreground"
              >
                {stepStates.find((step) => step.key === "B")?.isCompleted ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Review Exercise
                  </>
                ) : (
                  <>Open Exercise</>
                )}
              </a>
            ) : (
              <Button
                type="button"
                disabled
                className="w-full sm:w-auto min-h-11 sm:min-w-[180px] rounded-xl"
                variant="secondary"
              >
                <Lock className="mr-2 h-4 w-4" />
                Locked
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}