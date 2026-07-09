"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import type { AdminTeacherRow } from "@/lib/admin/queries/teachers";
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

interface AdminTeachersContentProps {
  initialTeachers: AdminTeacherRow[];
}

export function AdminTeachersContent({ initialTeachers }: AdminTeachersContentProps) {
  const router = useRouter();
  const [teachers, setTeachers] = useState(initialTeachers);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTeachers(initialTeachers);
  }, [initialTeachers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to create teacher");
      setSubmitting(false);
      return;
    }

    setForm({ name: "", email: "", password: "" });
    setCreateOpen(false);
    setSubmitting(false);
    router.refresh();
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-emerald-600";
    if (status === "pending") return "bg-amber-600";
    return "bg-red-600";
  };

  return (
    <>
      <AdminPageHeader title="Teachers" description="Manage teacher accounts" />
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]">
          Create teacher
        </Button>
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {teachers.length === 0 ? (
            <p className="p-5 text-muted-foreground">No teachers found.</p>
          ) : (
            <div className="divide-y">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-foreground">{teacher.full_name ?? "Teacher"}</p>
                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(teacher.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`rounded-full capitalize text-white ${statusColor(teacher.status)}`}>
                    {teacher.status}
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
            <DialogTitle>Create teacher account</DialogTitle>
            <DialogDescription>
              The teacher can log in immediately with these credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="teacher-name">Full name</Label>
              <Input
                id="teacher-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-email">Email</Label>
              <Input
                id="teacher-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-password">Temporary password</Label>
              <Input
                id="teacher-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={8}
                required
                className="rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]">
                {submitting ? "Creating..." : "Create teacher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
