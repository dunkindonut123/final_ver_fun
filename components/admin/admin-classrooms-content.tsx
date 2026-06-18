"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateClassCode } from "@/lib/lms/classroom";

interface ClassroomRow {
  id: string;
  name: string;
  classCode: string;
  hskLevel: number;
  teacherName: string;
  studentCount: number;
}

interface TeacherOption {
  id: string;
  full_name: string | null;
  status: string;
}

export function AdminClassroomsContent() {
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    teacherId: "",
    hskLevel: "1",
    classCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [classroomsRes, teachersRes] = await Promise.all([
      fetch("/api/admin/classrooms"),
      fetch("/api/admin/teachers"),
    ]);

    if (classroomsRes.ok) {
      const payload = await classroomsRes.json();
      setClassrooms(payload.classrooms ?? []);
    }

    if (teachersRes.ok) {
      const payload = await teachersRes.json();
      setTeachers(
        (payload.teachers ?? []).filter((t: TeacherOption) => t.status === "active")
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedTeacher = teachers.find((t) => t.id === form.teacherId);

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    setForm((f) => ({
      ...f,
      teacherId,
      classCode: teacher
        ? generateClassCode(teacher.full_name ?? "Teacher", Number(f.hskLevel))
        : f.classCode,
    }));
  };

  const handleHskChange = (hskLevel: string) => {
    setForm((f) => ({
      ...f,
      hskLevel,
      classCode: selectedTeacher
        ? generateClassCode(selectedTeacher.full_name ?? "Teacher", Number(hskLevel))
        : f.classCode,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/admin/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        teacherId: form.teacherId,
        hskLevel: Number(form.hskLevel),
        classCode: form.classCode,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to create classroom");
      setSubmitting(false);
      return;
    }

    setForm({ name: "", teacherId: "", hskLevel: "1", classCode: "" });
    setCreateOpen(false);
    setSubmitting(false);
    await loadData();
  };

  return (
    <AdminShell title="Classrooms" description="All classrooms across teachers">
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]">
          New classroom
        </Button>
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-muted-foreground">Loading...</p>
          ) : classrooms.length === 0 ? (
            <p className="p-5 text-muted-foreground">No classrooms found.</p>
          ) : (
            <div className="divide-y">
              {classrooms.map((classroom) => (
                <div key={classroom.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-foreground">{classroom.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {classroom.teacherName} · Code: {classroom.classCode}
                    </p>
                    <p className="text-xs text-muted-foreground">{classroom.studentCount} students</p>
                  </div>
                  <Badge className="rounded-full bg-[#1e5fa8] text-white">
                    HSK {classroom.hskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create classroom</DialogTitle>
            <DialogDescription>
              Create a classroom on behalf of an active teacher.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="classroom-name">Classroom name</Label>
              <Input
                id="classroom-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Kelas A"
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Assign to teacher</Label>
              <select
                id="teacher"
                value={form.teacherId}
                onChange={(e) => handleTeacherChange(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Select teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name ?? "Teacher"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsk-level">HSK level</Label>
              <select
                id="hsk-level"
                value={form.hskLevel}
                onChange={(e) => handleHskChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <option key={level} value={level}>
                    HSK {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-code">Class code</Label>
              <Input
                id="class-code"
                value={form.classCode}
                onChange={(e) => setForm((f) => ({ ...f, classCode: e.target.value.toUpperCase() }))}
                required
                className="rounded-xl uppercase"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]">
                {submitting ? "Creating..." : "Create classroom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
