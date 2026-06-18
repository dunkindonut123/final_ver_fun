"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  hskLevel: number;
  teacherName: string | null;
  classroomName: string | null;
  classCode: string | null;
}

interface ClassroomOption {
  id: string;
  name: string;
  classCode: string;
  hskLevel: number;
  teacherName: string;
}

type ModalMode = "reassign" | "update-level" | "delete" | null;

export function AdminStudentsContent() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [newHskLevel, setNewHskLevel] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [studentsRes, classroomsRes] = await Promise.all([
      fetch("/api/admin/students"),
      fetch("/api/admin/classrooms"),
    ]);

    if (studentsRes.ok) {
      const payload = await studentsRes.json();
      setStudents(payload.students ?? []);
    }

    if (classroomsRes.ok) {
      const payload = await classroomsRes.json();
      setClassrooms(payload.classrooms ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredClassrooms = useMemo(() => {
    if (modal === "update-level") {
      return classrooms.filter((c) => c.hskLevel === Number(newHskLevel));
    }
    return classrooms;
  }, [classrooms, modal, newHskLevel]);

  const openModal = (mode: ModalMode, student: StudentRow) => {
    setSelected(student);
    setModal(mode);
    setError(null);
    setClassroomId("");
    setNewHskLevel(String(Math.min(6, student.hskLevel + 1)));
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
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
    await loadData();
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
    await loadData();
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
    await loadData();
  };

  return (
    <AdminShell title="Students" description="Reassign, update HSK level, or delete student accounts">
      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-muted-foreground">Loading...</p>
          ) : students.length === 0 ? (
            <p className="p-5 text-muted-foreground">No students found.</p>
          ) : (
            <div className="divide-y">
              {students.map((student) => (
                <div key={student.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-[#1e5fa8] text-white">
                        HSK {student.hskLevel}
                      </Badge>
                      {student.classroomName ? (
                        <Badge variant="secondary" className="rounded-full">
                          {student.classroomName}
                        </Badge>
                      ) : null}
                      {student.teacherName ? (
                        <span className="text-xs text-muted-foreground">Teacher: {student.teacherName}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openModal("reassign", student)}
                      className="rounded-xl"
                    >
                      Reassign
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openModal("update-level", student)}
                      className="rounded-xl"
                    >
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                  {filteredClassrooms.map((c) => (
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
                  {[1, 2, 3, 4, 5, 6].map((level) => (
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
                  {filteredClassrooms.map((c) => (
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
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              {submitting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
