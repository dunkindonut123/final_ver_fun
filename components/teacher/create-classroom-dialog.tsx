"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateClassCode } from "@/lib/lms/classroom";
import { HSK_LEVELS } from "@/lib/lms/hsk-levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateClassroomDialogProps {
  teacherId: string;
  teacherName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateClassroomDialog({
  teacherId,
  teacherName,
  open,
  onOpenChange,
  onCreated,
}: CreateClassroomDialogProps) {
  const [name, setName] = useState("");
  const [hskLevel, setHskLevel] = useState("1");
  const [classCode, setClassCode] = useState(generateClassCode(teacherName, 1));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleHskChange = (value: string) => {
    setHskLevel(value);
    setClassCode(generateClassCode(teacherName, Number(value)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("classrooms").insert({
        name: name.trim(),
        class_code: classCode.trim().toUpperCase(),
        teacher_id: teacherId,
        hsk_level: Number(hskLevel),
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setName("");
      setHskLevel("1");
      setClassCode(generateClassCode(teacherName, 1));
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create classroom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Classroom</DialogTitle>
          <DialogDescription>Set up a new class and share the code with students.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="classroom-name">Classroom name</Label>
            <Input
              id="classroom-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kelas A"
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hsk-level">HSK level</Label>
            <select
              id="hsk-level"
              value={hskLevel}
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
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              required
              className="rounded-xl uppercase"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-[#1e5fa8] text-white">
            {loading ? "Creating..." : "Create classroom"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
