"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeacherShell } from "@/components/layout/teacher-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  completedCount: number;
  unlockedCount: number;
  totalCount: number;
  overallScore: number;
}

interface ClassroomContentProps {
  classroom: {
    id: string;
    name: string;
    class_code: string;
    hsk_level: number;
  };
  teacherId: string;
}

export function ClassroomContent({ classroom, teacherId }: ClassroomContentProps) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: studentRows } = await supabase
        .from("students")
        .select("user_id")
        .eq("classroom_id", classroom.id)
        .eq("teacher_id", teacherId);

      if (!studentRows || studentRows.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const ids = studentRows.map((row) => row.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      const { data: assignments } = await supabase
        .from("student_assignments")
        .select("student_id, is_locked, is_completed, score, assignment:assignments(chapter_id)")
        .in("student_id", ids);

      const stats = new Map<
        string,
        { completed: number; unlocked: number; total: number; scoreSum: number; scoreCount: number }
      >();
      ids.forEach((id) =>
        stats.set(id, { completed: 0, unlocked: 0, total: 0, scoreSum: 0, scoreCount: 0 })
      );

      (assignments ?? []).forEach((row) => {
        const assignment = Array.isArray(row.assignment) ? row.assignment[0] : row.assignment;
        if (!assignment?.chapter_id?.startsWith(`hsk${classroom.hsk_level}-`)) return;

        const current = stats.get(row.student_id);
        if (!current) return;
        current.total += 1;
        if (!row.is_locked) current.unlocked += 1;
        if (row.is_completed) {
          current.completed += 1;
          if (typeof row.score === "number") {
            current.scoreSum += row.score;
            current.scoreCount += 1;
          }
        }
      });

      setStudents(
        (profiles ?? []).map((profile) => {
          const s = stats.get(profile.id) ?? {
            completed: 0,
            unlocked: 0,
            total: 0,
            scoreSum: 0,
            scoreCount: 0,
          };
          return {
            id: profile.id,
            name: profile.full_name ?? "Student",
            completedCount: s.completed,
            unlockedCount: s.unlocked,
            totalCount: s.total,
            overallScore: s.scoreCount > 0 ? Math.round(s.scoreSum / s.scoreCount) : 0,
          };
        })
      );
      setLoading(false);
    };

    void load();
  }, [classroom.id, classroom.hsk_level, teacherId]);

  return (
    <TeacherShell>
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/teacher/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{classroom.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{classroom.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {classroom.hsk_level}</Badge>
          <span className="text-sm text-muted-foreground">Code: {classroom.class_code}</span>
        </div>
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-muted-foreground">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="p-6 text-muted-foreground">No students in this classroom yet.</p>
          ) : (
            <>
              <div className="hidden grid-cols-12 gap-4 border-b px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                <div className="col-span-4">Name</div>
                <div className="col-span-2 text-center">Completed</div>
                <div className="col-span-2 text-center">Unlocked</div>
                <div className="col-span-2 text-center">Overall score</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {students.map((student) => {
                  const progress =
                    student.totalCount > 0
                      ? Math.round((student.completedCount / student.totalCount) * 100)
                      : 0;
                  return (
                    <div
                      key={student.id}
                      className="grid grid-cols-1 items-center gap-4 px-5 py-4 md:grid-cols-12"
                    >
                      <div className="md:col-span-4">
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <div className="mt-2 h-1.5 w-full max-w-44 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#1e5fa8] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground md:col-span-2 md:text-center">
                        <span className="md:hidden">Completed: </span>
                        {student.completedCount}/{student.totalCount}
                      </div>
                      <div className="text-sm text-muted-foreground md:col-span-2 md:text-center">
                        <span className="md:hidden">Unlocked: </span>
                        {student.unlockedCount}
                      </div>
                      <div className="text-sm font-medium text-foreground md:col-span-2 md:text-center">
                        <span className="font-normal text-muted-foreground md:hidden">Score: </span>
                        {student.overallScore}%
                      </div>
                      <div className="md:col-span-2 md:text-right">
                        <Button asChild variant="outline" className="rounded-xl">
                          <Link href={`/teacher/student/${student.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
