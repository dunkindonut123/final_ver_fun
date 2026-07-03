"use client";

import Link from "next/link";
import { MAX_HSK_LEVEL } from "@/lib/lms/hsk-levels";
import type { AssignmentAttemptItem } from "@/lib/lms/assignment-attempts";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeacherShell } from "@/components/layout/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, CheckCircle2, Clock, Circle, TrendingUp } from "lucide-react";

type AssignmentStatus = "not_started" | "in_progress" | "completed";

interface AssignmentToggle {
  studentAssignmentId: string;
  title: string;
  assignmentKey: string;
  orderIndex: number;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  isLocked: boolean;
  isCompleted: boolean;
  score: number | null;
  status: AssignmentStatus;
}

interface PromotionFlag {
  status: "pending" | "approved" | "rejected";
  targetLevel: number;
  note: string | null;
}

interface StudentDetailContentProps {
  student: {
    id: string;
    name: string;
    email: string;
    hskLevel: number;
    classroomName: string | null;
  };
}

export function StudentDetailContent({ student }: StudentDetailContentProps) {
  const [assignments, setAssignments] = useState<AssignmentToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingChapterId, setUpdatingChapterId] = useState<string | null>(null);
  const [latestFlag, setLatestFlag] = useState<PromotionFlag | null>(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [note, setNote] = useState("");
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [attemptsByAssignment, setAttemptsByAssignment] = useState<
    Record<string, AssignmentAttemptItem[]>
  >({});
  const [loadingAttemptsId, setLoadingAttemptsId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { chapterNumber: number; chapterTitle: string; assignments: AssignmentToggle[] }
    >();

    assignments.forEach((item) => {
      const existing = map.get(item.chapterId);
      if (existing) {
        existing.assignments.push(item);
      } else {
        map.set(item.chapterId, {
          chapterNumber: item.chapterNumber,
          chapterTitle: item.chapterTitle,
          assignments: [item],
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map((group) => ({
        chapterId: group.assignments[0]?.chapterId ?? group.chapterTitle,
        chapterTitle: group.chapterTitle,
        chapterAssignments: group.assignments.sort((a, b) => a.orderIndex - b.orderIndex),
      }));
  }, [assignments]);

  const loadAssignments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("student_assignments")
      .select(
        "id, is_locked, is_completed, score, started_at, assignment:assignments(title, order_index, chapter_id, assignment_key)"
      )
      .eq("student_id", student.id);

    if (error || !data) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    const chapterIds = [
      ...new Set(
        data
          .map((row) => {
            const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
            return assignment?.chapter_id ?? null;
          })
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const chapterMap = new Map<string, { title: string; hsk_level: number; chapter_number: number }>();
    if (chapterIds.length > 0) {
      const { data: chapters } = await supabase
        .from("hsk_chapters")
        .select("id, title, hsk_level, chapter_number")
        .in("id", chapterIds);

      (chapters ?? []).forEach((chapter) => {
        chapterMap.set(chapter.id, {
          title: chapter.title,
          hsk_level: chapter.hsk_level,
          chapter_number: chapter.chapter_number,
        });
      });
    }

    const levelPrefix = `hsk${student.hskLevel}-`;

    const items = data
      .map((row) => {
        const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
        if (!assignment?.chapter_id?.startsWith(levelPrefix)) return null;

        const chapter = chapterMap.get(assignment.chapter_id);
        const chapterTitle = chapter?.title ?? assignment.chapter_id;
        const chapterNumber =
          chapter?.chapter_number ??
          Number.parseInt(assignment.chapter_id.match(/-ch(\d+)$/)?.[1] ?? "0", 10);

        const status: AssignmentStatus = row.is_completed
          ? "completed"
          : row.started_at
            ? "in_progress"
            : "not_started";

        return {
          studentAssignmentId: row.id,
          title: assignment.title,
          assignmentKey: assignment.assignment_key ?? "",
          orderIndex: assignment.order_index,
          chapterId: assignment.chapter_id,
          chapterNumber,
          chapterTitle,
          isLocked: row.is_locked,
          isCompleted: row.is_completed,
          score: row.score,
          status,
        } satisfies AssignmentToggle;
      })
      .filter((item): item is AssignmentToggle => item !== null)
      .sort((a, b) => a.chapterNumber - b.chapterNumber || a.orderIndex - b.orderIndex);

    setAssignments(items);
    setLoading(false);
  };

  const loadAssignmentAttempts = async (studentAssignmentId: string) => {
    setLoadingAttemptsId(studentAssignmentId);
    try {
      const response = await fetch(
        `/api/teacher/assignments/${studentAssignmentId}/attempt-history`
      );
      if (!response.ok) {
        setAttemptsByAssignment((current) => ({ ...current, [studentAssignmentId]: [] }));
        return;
      }

      const payload = await response.json();
      setAttemptsByAssignment((current) => ({
        ...current,
        [studentAssignmentId]: payload.attempts ?? [],
      }));
    } finally {
      setLoadingAttemptsId(null);
    }
  };

  const toggleAssignmentAttempts = (studentAssignmentId: string) => {
    if (expandedAssignmentId === studentAssignmentId) {
      setExpandedAssignmentId(null);
      return;
    }

    setExpandedAssignmentId(studentAssignmentId);
    if (!attemptsByAssignment[studentAssignmentId]) {
      void loadAssignmentAttempts(studentAssignmentId);
    }
  };

  const loadLatestFlag = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("promotion_flags")
      .select("status, target_level, note")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestFlag(
      data
        ? { status: data.status, targetLevel: data.target_level, note: data.note }
        : null
    );
  };

  useEffect(() => {
    void loadAssignments();
    void loadLatestFlag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, student.hskLevel]);

  const toggleLock = async (studentAssignmentId: string) => {
    setUpdatingId(studentAssignmentId);
    const response = await fetch(`/api/teacher/assignments/${studentAssignmentId}/toggle-lock`, {
      method: "PATCH",
    });
    if (response.ok) {
      await loadAssignments();
    }
    setUpdatingId(null);
  };

  const toggleChapterLock = async (chapterAssignments: AssignmentToggle[], wantUnlocked: boolean) => {
    const chapterId = chapterAssignments[0]?.chapterId;
    if (!chapterId) return;

    const toUpdate = chapterAssignments.filter((item) => item.isLocked === wantUnlocked);
    if (toUpdate.length === 0) return;

    setUpdatingChapterId(chapterId);
    const results = await Promise.all(
      toUpdate.map((item) =>
        fetch(`/api/teacher/assignments/${item.studentAssignmentId}/toggle-lock`, { method: "PATCH" })
      )
    );

    if (results.every((response) => response.ok)) {
      await loadAssignments();
    }
    setUpdatingChapterId(null);
  };

  const submitFlag = async () => {
    setFlagSubmitting(true);
    setFlagError(null);

    const response = await fetch("/api/teacher/promotions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, note: note.trim() || undefined }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setFlagError(payload.error ?? "Failed to flag for promotion");
      setFlagSubmitting(false);
      return;
    }

    setNote("");
    setFlagOpen(false);
    setFlagSubmitting(false);
    await loadLatestFlag();
  };

  const isMaxLevel = student.hskLevel >= MAX_HSK_LEVEL;
  const hasPending = latestFlag?.status === "pending";
  const targetLevel = Math.min(MAX_HSK_LEVEL, student.hskLevel + 1);

  const formatAttemptDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const statusBadge = (item: AssignmentToggle) => {
    if (item.status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Completed{item.score !== null ? ` (${item.score}%)` : ""}
        </span>
      );
    }
    if (item.status === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          In progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <Circle className="h-4 w-4" />
        Not started
      </span>
    );
  };

  return (
    <TeacherShell>
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/teacher/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{student.name}</span>
      </nav>

      <Card className="mb-6 rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
            <p className="text-muted-foreground">{student.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {student.hskLevel}</Badge>
              {student.classroomName ? (
                <Badge variant="secondary" className="rounded-full">
                  {student.classroomName}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => {
                setFlagError(null);
                setFlagOpen(true);
              }}
              disabled={isMaxLevel || hasPending}
              className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Flag for promotion
            </Button>
            {hasPending ? (
              <Badge className="rounded-full bg-amber-500 text-white">Promotion pending</Badge>
            ) : latestFlag?.status === "rejected" ? (
              <Badge className="rounded-full bg-red-500 text-white">Last promotion rejected</Badge>
            ) : isMaxLevel ? (
              <span className="text-xs text-muted-foreground">Already at HSK {MAX_HSK_LEVEL}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading assignments...</p>
      ) : grouped.length === 0 ? (
        <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No assignments found for HSK {student.hskLevel}. Assignments are created when the student
              joins a classroom.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ chapterId, chapterTitle, chapterAssignments }) => {
            const chapterUnlocked = chapterAssignments.every((item) => !item.isLocked);
            const chapterUpdating = updatingChapterId === chapterId;

            return (
              <Card
                key={chapterId}
                className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5"
              >
                <CardContent className="p-0">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4">
                    <h2 className="font-semibold text-foreground">{chapterTitle}</h2>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
                      <Label htmlFor={`chapter-lock-${chapterId}`} className="text-sm font-medium">
                        {chapterUnlocked ? "Chapter unlocked" : "Chapter locked"}
                      </Label>
                      <Switch
                        id={`chapter-lock-${chapterId}`}
                        checked={chapterUnlocked}
                        disabled={chapterUpdating || updatingId !== null}
                        onCheckedChange={(checked) => void toggleChapterLock(chapterAssignments, checked)}
                        aria-label={chapterUnlocked ? "Lock chapter" : "Unlock chapter"}
                      />
                    </div>
                  </div>
                  <div className="divide-y">
                    {chapterAssignments.map((assignment) => {
                      const isExpanded = expandedAssignmentId === assignment.studentAssignmentId;
                      const attempts = attemptsByAssignment[assignment.studentAssignmentId] ?? [];
                      const isLoadingAttempts =
                        loadingAttemptsId === assignment.studentAssignmentId;

                      return (
                        <div key={assignment.studentAssignmentId} className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <button
                              type="button"
                              onClick={() => toggleAssignmentAttempts(assignment.studentAssignmentId)}
                              className="flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left hover:bg-muted/40 -mx-2 px-2 py-1"
                              aria-expanded={isExpanded}
                            >
                              <ChevronDown
                                className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                  isExpanded && "rotate-180"
                                )}
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{assignment.title}</p>
                                <div className="mt-1">{statusBadge(assignment)}</div>
                              </div>
                            </button>
                            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
                              <Label
                                htmlFor={`assignment-lock-${assignment.studentAssignmentId}`}
                                className="text-sm text-muted-foreground"
                              >
                                {assignment.isLocked ? "Locked" : "Unlocked"}
                              </Label>
                              <Switch
                                id={`assignment-lock-${assignment.studentAssignmentId}`}
                                checked={!assignment.isLocked}
                                disabled={
                                  updatingId === assignment.studentAssignmentId || chapterUpdating
                                }
                                onCheckedChange={() => void toggleLock(assignment.studentAssignmentId)}
                                aria-label={assignment.isLocked ? "Unlock assignment" : "Lock assignment"}
                              />
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="mt-3 ml-6 rounded-xl border border-border bg-muted/30 p-3">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Attempt history (latest 5)
                              </p>
                              {isLoadingAttempts ? (
                                <p className="text-sm text-muted-foreground">Loading attempts...</p>
                              ) : attempts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No completed attempts for this assignment yet.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {attempts.map((attempt, index) => (
                                    <div
                                      key={attempt.id}
                                      className="flex items-center justify-between gap-3 rounded-lg bg-background/80 px-3 py-2 text-sm"
                                    >
                                      <span className="text-muted-foreground">
                                        Attempt {attempts.length - index}
                                      </span>
                                      <div className="text-right">
                                        <p className="font-semibold text-foreground">{attempt.score}%</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatAttemptDate(attempt.completedAt)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Flag for HSK promotion</DialogTitle>
            <DialogDescription>
              Send a promotion request to the admin for {student.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-muted p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Current level:</span> HSK {student.hskLevel}
              </p>
              <p>
                <span className="text-muted-foreground">Target level:</span> HSK {targetLevel}
              </p>
            </div>
            {flagError ? <p className="text-sm text-destructive">{flagError}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="promotion-note">Note (optional)</Label>
              <Textarea
                id="promotion-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why is this student ready to advance?"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={submitFlag}
              disabled={flagSubmitting}
              className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
            >
              {flagSubmitting ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherShell>
  );
}
