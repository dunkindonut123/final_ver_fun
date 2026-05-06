"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, LogOut, Lock, Unlock, ChevronRight } from "lucide-react";
import { summaryFromChapterProgress } from "@/lib/assignment-progress";

interface Student {
  id: string;
  name: string;
  email: string;
  current_hsk_level: number;
  current_bab: number;
  current_pertemuan: number;
  teacher: {
    name: string;
    email: string;
  } | null;
}

interface StudentDashboardContentProps {
  student: Student;
}

interface Chapter {
  id: string;
  title: string;
  hsk_level: number;
  chapter_number: number;
}

interface ChapterProgress {
  score?: number;
  completed: boolean;
}

export function StudentDashboardContent({
  student,
}: StudentDashboardContentProps) {
  const router = useRouter();
  const [access, setAccess] = useState<Map<string, boolean>>(new Map());
  const [progress, setProgress] = useState<Map<string, ChapterProgress>>(new Map());

  const chapters = useMemo<Chapter[]>(() => {
    const generated: Chapter[] = [];
    // Only generate chapters for the student's current HSK level
    for (let chapter = 1; chapter <= 10; chapter += 1) {
      generated.push({
        id: `hsk${student.current_hsk_level}-ch${chapter}`,
        title: `Chapter ${chapter}`,
        hsk_level: student.current_hsk_level,
        chapter_number: chapter,
      });
    }
    return generated;
  }, [student.current_hsk_level]);

  useEffect(() => {
    const loadAccessAndProgress = async () => {
      const supabase = createClient();

      // Optional tables for teacher-controlled unlocks and student progress.
      // If tables are not created yet, dashboard still works with all cards locked.
      const { data: accessData, error: accessError } = await supabase
        .from("student_chapter_access")
        .select("chapter_id, is_unlocked")
        .eq("student_id", student.id);

      if (!accessError && accessData) {
        const nextAccess = new Map<string, boolean>();
        accessData.forEach((row) => {
          nextAccess.set(row.chapter_id, row.is_unlocked === true);
        });
        setAccess(nextAccess);
      }

      const { data: progressData, error: progressError } = await supabase
        .from("student_chapter_progress")
        .select("chapter_id, score, is_completed")
        .eq("student_id", student.id);

      if (!progressError && progressData) {
        const nextProgress = new Map<string, ChapterProgress>();
        progressData.forEach((row) => {
          nextProgress.set(row.chapter_id, {
            score: typeof row.score === "number" ? row.score : undefined,
            completed: row.is_completed === true,
          });
        });
        setProgress(nextProgress);
      }

    };

    loadAccessAndProgress();
  }, [student.id]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  };

  const renderChapterCard = (chapter: Chapter) => {
    const isUnlocked = access.get(chapter.id) === true;
    const chapterProgress = progress.get(chapter.id);
    const assignmentSummary = summaryFromChapterProgress(chapterProgress?.score ?? null);
    const isCompleted = chapterProgress?.completed === true || assignmentSummary.isComplete;

    if (isUnlocked) {
      return (
        <Link href={`/assignment/${chapter.id}`} key={chapter.id} className="block w-60 flex-shrink-0">
          <Card className="h-full rounded-2xl border border-[#1e5fa8]/30 bg-gradient-to-br from-[#1e5fa8]/5 to-[#f9a825]/5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{`HSK ${chapter.hsk_level}`}</p>
                  <h3 className="text-base font-semibold text-card-foreground">{chapter.title}</h3>
                </div>
                <Badge className="rounded-full bg-emerald-500 text-white">
                  <Unlock className="mr-1 h-3 w-3" />
                  Open
                </Badge>
              </div>

              {isCompleted ? (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                  <p className="font-medium">Completed</p>
                  {chapterProgress && typeof chapterProgress.score === "number" ? (
                    <p className="mt-1 text-xs">Score: {chapterProgress.score}%</p>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-[#1e5fa8]/10 p-3 text-sm text-[#1e5fa8]">
                  <span>Start assignment</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      );
    }

    return (
      <div key={chapter.id} className="w-60 flex-shrink-0">
        <Card className="h-full rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 opacity-80">
          <CardContent className="p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-slate-500">{`HSK ${chapter.hsk_level}`}</p>
                <h3 className="text-base font-semibold text-slate-700">{chapter.title}</h3>
              </div>
              <Badge variant="secondary" className="rounded-full">
                <Lock className="mr-1 h-3 w-3" />
                Locked
              </Badge>
            </div>
            <div className="rounded-xl bg-slate-200 p-3 text-sm text-slate-600">
              Waiting for teacher to unlock
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-36 -right-20 h-80 w-80 rounded-full bg-[#1e5fa8]/8 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-[#e53935]/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-[#f9a825]/8 blur-3xl" />
      </div>

      <header className="relative z-10 px-4 pt-3">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/20 bg-background/70 shadow-lg shadow-foreground/5 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e5fa8]/10">
                <BookOpen className="h-5 w-5 text-[#1e5fa8]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-card-foreground">Fun Mandarin</h1>
                <p className="text-sm text-muted-foreground">Student Portal</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl bg-background/70"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {student.name}!
          </h2>
          <p className="text-muted-foreground">
            Open unlocked chapters and complete assignments
          </p>
        </div>

        <Card className="mb-8 rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {student.current_hsk_level}</Badge>
              <span>{`Current Bab ${student.current_bab}, Pertemuan ${student.current_pertemuan}`}</span>
              {student.teacher ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {`Teacher: ${student.teacher.name}`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Teacher not assigned
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {[student.current_hsk_level].map((level) => {
            const levelChapters = chapters.filter((chapter) => chapter.hsk_level === level);
            const unlockedCount = levelChapters.filter(
              (chapter) => access.get(chapter.id) === true
            ).length;

            return (
              <section key={level}>
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{`HSK Level ${level}`}</h3>
                    <p className="text-sm text-muted-foreground">
                      {`${unlockedCount}/${levelChapters.length} chapters unlocked`}
                    </p>
                  </div>
                  <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-[#1e5fa8] transition-all"
                      style={{
                        width:
                          levelChapters.length === 0
                            ? "0%"
                            : `${(unlockedCount / levelChapters.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
                  {levelChapters.map((chapter) => renderChapterCard(chapter))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
