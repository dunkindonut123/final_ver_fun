"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface AssignmentRetryButtonProps {
  studentAssignmentId: string;
}

export function AssignmentRetryButton({ studentAssignmentId }: AssignmentRetryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/student/assignments/${studentAssignmentId}/retry`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error ?? "Failed to restart assignment.");
        return;
      }

      router.push(`/student/assignment/${studentAssignmentId}`);
      router.refresh();
    } catch {
      setError("Failed to restart assignment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto min-h-11 rounded-xl"
        onClick={handleRetry}
        disabled={loading}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        {loading ? "Starting..." : "Retry"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </>
  );
}
