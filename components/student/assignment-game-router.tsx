"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MandarinTypingGame } from "@/components/mandarin-typing-game";
import { isAssignmentALevel } from "@/lib/mandarin-typing-questions";
import type { HSKLevel } from "@/lib/hanzi-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const AssignmentBGame = dynamic(
  () => import("@/components/assignment-b-game").then((m) => m.AssignmentBGame),
  { ssr: false }
);

interface AssignmentGameRouterProps {
  studentAssignmentId: string;
  chapterId: string;
  hskLevel: number;
  assignmentKey: string;
  assignmentTitle: string;
  isLocked: boolean;
  isCompleted: boolean;
}

export function AssignmentGameRouter({
  studentAssignmentId,
  chapterId,
  hskLevel,
  assignmentKey,
  assignmentTitle,
  isLocked,
  isCompleted,
}: AssignmentGameRouterProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const returnHref = `/student/chapter/${chapterId}`;

  const handleCompleteB = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/student/assignments/${studentAssignmentId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: 100 }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Failed to save progress.");
        return;
      }

      setMessage("Assignment marked complete.");
    } catch {
      setMessage("Failed to save progress.");
    } finally {
      setSaving(false);
    }
  };

  if (isLocked) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md rounded-2xl">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold">Assignment Locked</h1>
            <p className="mt-2 text-muted-foreground">Your teacher has not unlocked this assignment yet.</p>
            <Button asChild className="mt-6 rounded-xl">
              <Link href={returnHref}>Back to chapter</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (assignmentKey === "B") {
    return (
      <div>
        <div className="border-b border-border bg-background px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link href={returnHref} className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {assignmentTitle}
            </Link>
            {!isCompleted ? (
              <Button
                onClick={handleCompleteB}
                disabled={saving}
                className="rounded-xl bg-[#1e5fa8] text-white hover:bg-[#1a5292]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Complete"}
              </Button>
            ) : (
              <span className="text-sm text-emerald-600">Completed</span>
            )}
          </div>
          {message ? <p className="mx-auto mt-2 max-w-6xl text-sm text-muted-foreground">{message}</p> : null}
        </div>
        <AssignmentBGame chapterId={chapterId} level={hskLevel as HSKLevel} />
      </div>
    );
  }

  if (isAssignmentALevel(assignmentKey)) {
    return (
      <MandarinTypingGame
        hskLevel={hskLevel as 1 | 2 | 3 | 4}
        assignmentLevel={assignmentKey}
        chapterId={chapterId}
        studentAssignmentId={studentAssignmentId}
        returnHref={returnHref}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p className="text-muted-foreground">Unsupported assignment type.</p>
    </main>
  );
}
