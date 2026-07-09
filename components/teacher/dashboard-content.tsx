"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateClassroomDialog } from "@/components/teacher/create-classroom-dialog";
import type { TeacherClassroomRow } from "@/lib/teacher/queries/classrooms";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Plus, Users } from "lucide-react";

interface TeacherDashboardContentProps {
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  initialClassrooms: TeacherClassroomRow[];
}

export function TeacherDashboardContent({
  teacher,
  initialClassrooms,
}: TeacherDashboardContentProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Classrooms</h1>
          <p className="text-muted-foreground">Welcome back, {teacher.name}</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
        >
          <Plus className="mr-2 h-4 w-4" />
          New classroom
        </Button>
      </div>

      {initialClassrooms.length === 0 ? (
        <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
          <CardContent className="p-12 text-center">
            <p className="text-lg text-muted-foreground">
              No classrooms yet. Create one to get a class code for students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialClassrooms.map((classroom) => (
            <Card
              key={classroom.id}
              className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <CardContent className="p-6">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{classroom.name}</h2>
                    <Badge className="mt-2 rounded-full bg-[#1e5fa8] text-white">
                      HSK {classroom.hsk_level}
                    </Badge>
                  </div>
                  <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {classroom.student_count}
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#1e5fa8]/20 bg-[#1e5fa8]/5 p-3">
                  <code className="flex-1 font-mono text-sm font-bold text-[#1e5fa8]">
                    {classroom.class_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(classroom.class_code)}
                  >
                    {copiedCode === classroom.class_code ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <Button asChild className="w-full rounded-xl" variant="outline">
                  <Link href={`/teacher/classroom/${classroom.id}`}>View classroom</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateClassroomDialog
        teacherId={teacher.id}
        teacherName={teacher.name}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
