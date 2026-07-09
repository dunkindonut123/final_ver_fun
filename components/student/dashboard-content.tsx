"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentShell } from "@/components/layout/student-shell";
import { Users, ChevronRight } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  current_hsk_level: number;
  teacher: { name: string; email: string } | null;
  classroom: { name: string } | null;
}

interface Chapter {
  id: string;
  title: string;
  hsk_level: number;
  chapter_number: number;
}

interface StudentDashboardContentProps {
  student: Student;
  chapterProgress: Record<string, { completed: number; total: number }>;
}

export function StudentDashboardContent({ student, chapterProgress }: StudentDashboardContentProps) {
  const chapters = useMemo<Chapter[]>(() => {
    const generated: Chapter[] = [];
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

  return (
    <StudentShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Welcome back, {student.name}!</h2>
        <p className="text-muted-foreground">Open chapters and complete unlocked assignments</p>
      </div>

      <Card className="mb-8 rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {student.current_hsk_level}</Badge>
            {student.classroom ? <span>Classroom: {student.classroom.name}</span> : null}
            {student.teacher ? (
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                Teacher: {student.teacher.name}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-foreground">HSK Level {student.current_hsk_level}</h3>
          <p className="text-sm text-muted-foreground">{chapters.length} chapters</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {chapters.map((chapter) => {
            const progress = chapterProgress[chapter.id] ?? { completed: 0, total: 4 };
            const isComplete = progress.completed === progress.total && progress.total > 0;

            return (
              <Link href={`/student/chapter/${chapter.id}`} key={chapter.id} className="block w-60 flex-shrink-0">
                <Card className="h-full rounded-2xl border border-[#1e5fa8]/30 bg-gradient-to-br from-[#1e5fa8]/5 to-[#f9a825]/5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">HSK {chapter.hsk_level}</p>
                        <h3 className="text-base font-semibold text-card-foreground">{chapter.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {progress.completed}/{progress.total} assignments
                        </p>
                      </div>
                      {isComplete ? (
                        <Badge className="rounded-full bg-emerald-500 text-white">Done</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#1e5fa8]/10 p-3 text-sm text-[#1e5fa8]">
                      <span>View chapter</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </StudentShell>
  );
}
