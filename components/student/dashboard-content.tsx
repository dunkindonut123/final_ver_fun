"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  GraduationCap,
  Users,
  LogOut,
  TrendingUp,
} from "lucide-react";

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

const hskLevelDescriptions: Record<number, string> = {
  1: "Beginner - 150 words",
  2: "Elementary - 300 words",
  3: "Intermediate - 600 words",
  4: "Upper Intermediate - 1200 words",
  5: "Advanced - 2500 words",
  6: "Proficient - 5000+ words",
};

export function StudentDashboardContent({
  student,
}: StudentDashboardContentProps) {
  const router = useRouter();

  const handleLogout = async () => {
    // TODO: call auth signOut API when DB/auth backend is wired.
    router.push("/signin");
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
            Track your HSK learning progress below
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full rounded-2xl border-0 shadow-lg shadow-foreground/5 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Current HSK Level
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e5fa8] text-white">
                  <span className="text-2xl font-bold">
                    {student.current_hsk_level}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-card-foreground">HSK Level {student.current_hsk_level}</p>
                  <p className="text-sm text-muted-foreground">
                    {hskLevelDescriptions[student.current_hsk_level] ?? "Level info coming soon"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-lg shadow-foreground/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Current Bab</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-card-foreground">
                  {student.current_bab}
                </span>
                <Badge variant="secondary" className="rounded-full">Chapter</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                You are currently studying Chapter {student.current_bab}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-lg shadow-foreground/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Current Pertemuan</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-card-foreground">
                  {student.current_pertemuan}
                </span>
                <Badge variant="secondary" className="rounded-full">Meeting</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Meeting {student.current_pertemuan} of the current chapter
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-full rounded-2xl border-0 shadow-lg shadow-foreground/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">Your Teacher</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {student.teacher ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e5fa8]/10 text-[#1e5fa8]">
                    <span className="text-lg font-semibold">
                      {student.teacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground">{student.teacher.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.teacher.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No teacher assigned</p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-full rounded-2xl border-0 shadow-lg shadow-foreground/5">
            <CardHeader>
              <CardTitle className="text-card-foreground">Learning Progress Overview</CardTitle>
              <CardDescription>
                Your progress is tracked and updated by your teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-secondary/70 p-4">
                  <div>
                    <p className="font-medium text-secondary-foreground">HSK Level Progress</p>
                    <p className="text-sm text-muted-foreground">
                      Level {student.current_hsk_level} of 6
                    </p>
                  </div>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#1e5fa8] transition-all"
                      style={{
                        width: `${(student.current_hsk_level / 6) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/70 p-4">
                  <div>
                    <p className="font-medium text-secondary-foreground">Current Chapter</p>
                    <p className="text-sm text-muted-foreground">
                      Bab {student.current_bab}, Pertemuan {student.current_pertemuan}
                    </p>
                  </div>
                  <Badge className="rounded-full bg-[#1e5fa8] text-white">In Progress</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
