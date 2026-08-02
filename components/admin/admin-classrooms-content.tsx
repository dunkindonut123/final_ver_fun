"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import type { AdminClassroomRow } from "@/lib/admin/queries/classrooms";
import type { AdminStudentRow } from "@/lib/admin/queries/students";
import type { AdminTeacherRow } from "@/lib/admin/queries/teachers";
import { HSK_LEVELS, MAX_HSK_LEVEL } from "@/lib/lms/hsk-levels";
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
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type ClassroomRow = Pick<
  AdminClassroomRow,
  "id" | "name" | "classCode" | "hskLevel" | "teacherName" | "studentCount"
>;

type StudentRow = Pick<
  AdminStudentRow,
  | "id"
  | "name"
  | "email"
  | "hskLevel"
  | "teacherName"
  | "classroomId"
  | "classroomName"
  | "classCode"
>;

type TeacherOption = Pick<AdminTeacherRow, "id" | "full_name" | "status">;

type ModalMode = "reassign" | "update-level" | "delete" | "delete-classroom" | null;

const UNASSIGNED_KEY = "__unassigned__";

function matchesSearch(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

interface AdminClassroomsContentProps {
  initialClassrooms: ClassroomRow[];
  initialStudents: StudentRow[];
  initialTeachers: TeacherOption[];
}

export function AdminClassroomsContent({
  initialClassrooms,
  initialStudents,
  initialTeachers,
}: AdminClassroomsContentProps) {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState(initialClassrooms);
  const [students, setStudents] = useState(initialStudents);
  const [teachers, setTeachers] = useState(initialTeachers);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    teacherId: "",
    hskLevel: "1",
    classCode: "",
  });
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomRow | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [newHskLevel, setNewHskLevel] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setClassrooms(initialClassrooms);
    setStudents(initialStudents);
    setTeachers(initialTeachers);
  }, [initialClassrooms, initialStudents, initialTeachers]);

  const query = search.trim().toLowerCase();

  const studentsByClassroom = useMemo(() => {
    const map = new Map<string, StudentRow[]>();
    students.forEach((student) => {
      const key = student.classroomId ?? UNASSIGNED_KEY;
      const list = map.get(key) ?? [];
      list.push(student);
      map.set(key, list);
    });
    return map;
  }, [students]);

  const studentMatchesQuery = (student: StudentRow) => {
    if (!query) return true;
    return (
      matchesSearch(student.name, query) ||
      matchesSearch(student.email, query) ||
      matchesSearch(student.teacherName ?? "", query) ||
      matchesSearch(student.classroomName ?? "", query) ||
      matchesSearch(student.classCode ?? "", query) ||
      matchesSearch(`hsk ${student.hskLevel}`, query)
    );
  };

  const classroomMatchesQuery = (classroom: ClassroomRow) => {
    if (!query) return true;
    return (
      matchesSearch(classroom.name, query) ||
      matchesSearch(classroom.classCode, query) ||
      matchesSearch(classroom.teacherName, query) ||
      matchesSearch(`hsk ${classroom.hskLevel}`, query)
    );
  };

  const visibleClassrooms = useMemo(() => {
    return classrooms.filter((classroom) => {
      if (!query) return true;
      if (classroomMatchesQuery(classroom)) return true;
      const classroomStudents = studentsByClassroom.get(classroom.id) ?? [];
      return classroomStudents.some(studentMatchesQuery);
    });
  }, [classrooms, query, studentsByClassroom]);

  const unassignedStudents = useMemo(() => {
    const list = studentsByClassroom.get(UNASSIGNED_KEY) ?? [];
    if (!query) return list;
    return list.filter(studentMatchesQuery);
  }, [studentsByClassroom, query]);

  const showUnassigned = unassignedStudents.length > 0 && (!query || unassignedStudents.length > 0);

  useEffect(() => {
    if (!query) return;
    const ids = new Set(visibleClassrooms.map((c) => c.id));
    if (unassignedStudents.length > 0) ids.add(UNASSIGNED_KEY);
    setExpandedIds(ids);
  }, [query, visibleClassrooms, unassignedStudents.length]);

  const filteredClassroomsForModal = useMemo(() => {
    if (modal === "update-level") {
      return classrooms.filter((c) => c.hskLevel === Number(newHskLevel));
    }
    return classrooms;
  }, [classrooms, modal, newHskLevel]);

  const selectedTeacher = teachers.find((t) => t.id === form.teacherId);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    router.refresh();
  };

  const openModal = (mode: ModalMode, student: StudentRow) => {
    setSelected(student);
    setSelectedClassroom(null);
    setModal(mode);
    setError(null);
    setClassroomId("");
    setNewHskLevel(String(Math.min(MAX_HSK_LEVEL, student.hskLevel + 1)));
  };

  const openDeleteClassroomModal = (classroom: ClassroomRow) => {
    setSelected(null);
    setSelectedClassroom(classroom);
    setModal("delete-classroom");
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setSelectedClassroom(null);
    setError(null);
  };

  const handleReassign = async () => {
    if (!selected || !classroomId) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/admin/students/${selected.id}/reassign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to reassign student");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    router.refresh();
  };

  const handleUpdateLevel = async () => {
    if (!selected || !classroomId) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/admin/students/${selected.id}/update-level`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hskLevel: Number(newHskLevel), classroomId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to update HSK level");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    router.refresh();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/admin/students/${selected.id}`, { method: "DELETE" });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to delete student");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    router.refresh();
  };

  const handleDeleteClassroom = async () => {
    if (!selectedClassroom) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/admin/classrooms/${selectedClassroom.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to delete classroom");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    closeModal();
    router.refresh();
  };

  const renderStudentRow = (student: StudentRow) => (
    <div
      key={student.id}
      className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 bg-muted/20 px-5 py-4 pl-12"
    >
      <div>
        <p className="font-medium text-foreground">{student.name}</p>
        <p className="text-sm text-muted-foreground">{student.email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {student.hskLevel}</Badge>
          {student.teacherName ? (
            <span className="text-xs text-muted-foreground">Teacher: {student.teacherName}</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => openModal("reassign", student)} className="rounded-xl">
          Reassign
        </Button>
        <Button variant="outline" onClick={() => openModal("update-level", student)} className="rounded-xl">
          Update HSK
        </Button>
        <Button
          variant="outline"
          onClick={() => openModal("delete", student)}
          className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );

  const renderClassroomSection = (classroom: ClassroomRow) => {
    const allStudents = studentsByClassroom.get(classroom.id) ?? [];
    const visibleStudents = query ? allStudents.filter(studentMatchesQuery) : allStudents;
    const isExpanded = expandedIds.has(classroom.id);

    return (
      <div key={classroom.id} className="border-b border-border/60 last:border-b-0">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
          <button
            type="button"
            onClick={() => toggleExpanded(classroom.id)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="font-medium text-foreground">{classroom.name}</p>
              <p className="text-sm text-muted-foreground">
                {classroom.teacherName} · Code: {classroom.classCode}
              </p>
              <p className="text-xs text-muted-foreground">
                {visibleStudents.length}
                {query && visibleStudents.length !== allStudents.length
                  ? ` of ${allStudents.length}`
                  : ""}{" "}
                students
              </p>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="rounded-full bg-[#1e5fa8] text-white">HSK {classroom.hskLevel}</Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => openDeleteClassroomModal(classroom)}
              className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
        {isExpanded ? (
          visibleStudents.length === 0 ? (
            <p className="border-t border-border/60 bg-muted/20 px-5 py-4 pl-12 text-sm text-muted-foreground">
              No students in this classroom.
            </p>
          ) : (
            visibleStudents.map(renderStudentRow)
          )
        ) : null}
      </div>
    );
  };

  return (
    <>
      <AdminPageHeader
        title="Classrooms"
        description="Manage classrooms and search students to reassign, update HSK level, or delete accounts"
      />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students, classrooms, teachers, or class codes..."
            className="rounded-xl pl-10"
          />
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
        >
          New classroom
        </Button>
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {visibleClassrooms.length === 0 && !showUnassigned ? (
            <p className="p-5 text-muted-foreground">
              {query ? "No classrooms or students match your search." : "No classrooms found."}
            </p>
          ) : (
            <>
              {visibleClassrooms.map(renderClassroomSection)}
              {showUnassigned ? (
                <div className="border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(UNASSIGNED_KEY)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
                  >
                    {expandedIds.has(UNASSIGNED_KEY) ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">Unassigned students</p>
                      <p className="text-xs text-muted-foreground">
                        {unassignedStudents.length} student{unassignedStudents.length === 1 ? "" : "s"} without a
                        classroom
                      </p>
                    </div>
                  </button>
                  {expandedIds.has(UNASSIGNED_KEY) ? unassignedStudents.map(renderStudentRow) : null}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create classroom</DialogTitle>
            <DialogDescription>Create a classroom on behalf of an active teacher.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && modal === null ? <p className="text-sm text-destructive">{error}</p> : null}
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
                {HSK_LEVELS.map((level) => (
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
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
              >
                {submitting ? "Creating..." : "Create classroom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "reassign"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reassign student</DialogTitle>
            <DialogDescription>
              Move {selected?.name} to a different classroom. HSK level stays the same.
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Current classroom:</span>{" "}
                  {selected.classroomName ?? "None"} ({selected.classCode ?? "—"})
                </p>
                <p>
                  <span className="text-muted-foreground">Current teacher:</span> {selected.teacherName ?? "—"}
                </p>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="space-y-2">
                <Label>New classroom</Label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select classroom...</option>
                  {filteredClassroomsForModal.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.teacherName} · HSK {c.hskLevel} · {c.classCode}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleReassign}
                  disabled={!classroomId || submitting}
                  className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
                >
                  {submitting ? "Saving..." : "Reassign"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "update-level"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Update HSK level</DialogTitle>
            <DialogDescription>
              Promote {selected?.name} to a new HSK level and classroom.
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Current HSK level:</span> HSK {selected.hskLevel}
                </p>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="space-y-2">
                <Label>New HSK level</Label>
                <select
                  value={newHskLevel}
                  onChange={(e) => {
                    setNewHskLevel(e.target.value);
                    setClassroomId("");
                  }}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {HSK_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      HSK {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>New classroom (HSK {newHskLevel})</Label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select classroom...</option>
                  {filteredClassroomsForModal.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.teacherName} · {c.classCode}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleUpdateLevel}
                  disabled={!classroomId || submitting}
                  className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
                >
                  {submitting ? "Saving..." : "Update level"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "delete"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete student</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selected?.name}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={submitting}
              className={cn("rounded-xl bg-red-600 hover:bg-red-700")}
            >
              {submitting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "delete-classroom"} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete classroom</DialogTitle>
            <DialogDescription>
              Delete {selectedClassroom?.name}? Students in this classroom will be unassigned, not
              deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteClassroom}
              disabled={submitting}
              className={cn("rounded-xl bg-red-600 hover:bg-red-700")}
            >
              {submitting ? "Deleting..." : "Delete classroom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
