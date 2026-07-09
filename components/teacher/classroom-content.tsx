"use client";

import Link from "next/link";
import type { ClassroomStudentRow } from "@/lib/teacher/queries/classroom-students";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface ClassroomContentProps {
  classroom: {
    id: string;
    name: string;
    class_code: string;
    hsk_level: number;
  };
  teacherId: string;
  initialStudents: ClassroomStudentRow[];
}

export function ClassroomContent({
  classroom,
  initialStudents,
}: ClassroomContentProps) {
  return (
    <>
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
          {initialStudents.length === 0 ? (
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
                {initialStudents.map((student) => {
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
    </>
  );
}
