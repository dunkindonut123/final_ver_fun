"use client";

import Link from "next/link";
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
import { ChevronRight, CheckCircle2, Clock, Circle, TrendingUp } from "lucide-react";

type AssignmentStatus = "not_started" | "in_progress" | "completed";

interface AssignmentToggle {
  studentAssignmentId: string;
  title: string;
  orderIndex: number;
  chapterId: string;
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

  const grouped = useMemo(() => {
    const map = new Map<string, AssignmentToggle[]>();
    assignments.forEach((item) => {
      const list = map.get(item.chapterTitle) ?? [];
      list.push(item);
      map.set(item.chapterTitle, list);
    });
    return Array.from(map.entries());
  }, [assignments]);

  const loadAssignments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("student_assignments")
      .select(
        "id, is_locked, is_completed, score, started_at, assignment:assignments(title, order_index, chapter_id)"
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

    const chapterMap = new Map<string, { title: string; hsk_level: number }>();
    if (chapterIds.length > 0) {
      const { data: chapters } = await supabase
        .from("hsk_chapters")
        .select("id, title, hsk_level")
        .in("id", chapterIds);

      (chapters ?? []).forEach((chapter) => {
        chapterMap.set(chapter.id, { title: chapter.title, hsk_level: chapter.hsk_level });
      });
    }

    const levelPrefix = `hsk${student.hskLevel}-`;

    const items = data
      .map((row) => {
        const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
        if (!assignment?.chapter_id?.startsWith(levelPrefix)) return null;

        const chapter = chapterMap.get(assignment.chapter_id);
        const chapterTitle = chapter?.title ?? assignment.chapter_id;

        const status: AssignmentStatus = row.is_completed
          ? "completed"
          : row.started_at
            ? "in_progress"
            : "not_started";

        return {
          studentAssignmentId: row.id,
          title: assignment.title,
          orderIndex: assignment.order_index,
          chapterId: assignment.chapter_id,
          chapterTitle,
          isLocked: row.is_locked,
          isCompleted: row.is_completed,
          score: row.score,
          status,
        } satisfies AssignmentToggle;
      })
      .filter((item): item is AssignmentToggle => item !== null)
      .sort((a, b) => a.chapterTitle.localeCompare(b.chapterTitle) || a.orderIndex - b.orderIndex);

    setAssignments(items);
    setLoading(false);
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

  const toggleChapterLock = async (chapterAssignments: AssignmentToggle[], unlock: boolean) => {
    const chapterId = chapterAssignments[0]?.chapterId;
    if (!chapterId) return;

    const toUpdate = chapterAssignments.filter((item) => item.isLocked === unlock);
    if (toUpdate.length === 0) return;

    setUpdatingChapterId(chapterId);
    await Promise.all(
      toUpdate.map((item) =>
        fetch(`/api/teacher/assignments/${item.studentAssignmentId}/toggle-lock`, { method: "PATCH" })
      )
    );
    await loadAssignments();
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

  const isMaxLevel = student.hskLevel >= 6;
  const hasPending = latestFlag?.status === "pending";
  const targetLevel = Math.min(6, student.hskLevel + 1);

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
              <span className="text-xs text-muted-foreground">Already at HSK 6</span>
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
          {grouped.map(([chapterTitle, chapterAssignments]) => {
            const chapterId = chapterAssignments[0]?.chapterId ?? chapterTitle;
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
                        onCheckedChange={(checked) => void toggleChapterLock(chapterAssignments, !checked)}
                        aria-label={chapterUnlocked ? "Lock chapter" : "Unlock chapter"}
                      />
                    </div>
                  </div>
                  <div className="divide-y">
                    {chapterAssignments.map((assignment) => (
                      <div
                        key={assignment.studentAssignmentId}
                        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{assignment.title}</p>
                          <div className="mt-1">{statusBadge(assignment)}</div>
                        </div>
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
                    ))}
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
