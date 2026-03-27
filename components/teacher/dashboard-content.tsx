"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StudentManagementModal from "@/components/StudentManagementModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Copy, Check } from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface TeacherDashboardContentProps {
  teacher: {
    id: string;
    name: string;
    email: string;
    teacherCode: string;
  };
}

export function TeacherDashboardContent({ teacher }: TeacherDashboardContentProps) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const supabase = createClient();

        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("user_id")
          .eq("teacher_id", teacher.id)
          .order("created_at", { ascending: false });

        if (studentsError) {
          setError("Failed to load students");
          return;
        }

        const studentIds = (studentsData ?? []).map((row) => row.user_id);

        if (studentIds.length === 0) {
          setStudents([]);
          return;
        }

        const { data: studentProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds);

        if (profilesError) {
          setError("Failed to load students");
          return;
        }

        const mappedStudents: Student[] = (studentProfiles ?? []).map((profile) => {
          const fullName = (profile.full_name ?? "Student").trim();
          const [firstName, ...rest] = fullName.split(/\s+/);

          return {
            id: profile.id,
            first_name: firstName || "Student",
            last_name: rest.join(" "),
          };
        });

        setStudents(mappedStudents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [teacher.id]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teacher.teacherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center">
          <div className="mb-4 text-2xl">Loading...</div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <h1 className="mb-2 text-2xl font-bold text-red-600">Error</h1>
          <p className="mb-4 text-slate-600">{error}</p>
          <Button onClick={handleLogout}>Log Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Classroom</h1>
            <p className="text-slate-600">Welcome back, {teacher.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut size={18} />
            Log Out
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card className="mb-8 rounded-lg border-0 p-0 shadow-md">
          <CardContent className="p-6">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Your Teacher Code</h2>
            <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              <code className="flex-1 text-lg font-mono font-bold text-indigo-900">
                {teacher.teacherCode}
              </code>
              <Button onClick={handleCopyCode} size="sm" variant="outline" className="flex items-center gap-2">
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Share this code with your students so they can join your classroom.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-6 text-2xl font-bold text-slate-900">My Students ({students.length})</h2>

          {students.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow-md">
              <p className="text-lg text-slate-600">
                No students yet. Share your teacher code to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="rounded-lg bg-white p-6 text-left shadow-md transition-shadow hover:shadow-lg"
                >
                  <h3 className="text-lg font-bold text-slate-900">
                    {student.first_name} {student.last_name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">Click to manage</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStudent ? (
        <StudentManagementModal
          studentId={selectedStudent.id}
          studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`.trim()}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}
    </div>
  );
}
