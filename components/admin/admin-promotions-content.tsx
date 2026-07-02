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

interface PromotionRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  flaggedByName: string;
  currentLevel: number;
  targetLevel: number;
  status: string;
  note: string | null;
  createdAt: string;
}

interface ClassroomOption {
  id: string;
  name: string;
  classCode: string;
  hskLevel: number;
  teacherName: string;
}

export function AdminPromotionsContent() {
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [approveTarget, setApproveTarget] = useState<PromotionRow | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = async () => {
    const [promotionsRes, classroomsRes] = await Promise.all([
      fetch(`/api/admin/promotions?status=${filter}`),
      fetch("/api/admin/classrooms"),
    ]);

    if (promotionsRes.ok) {
      const payload = await promotionsRes.json();
      setPromotions(payload.promotions ?? []);
    }

    if (classroomsRes.ok) {
      const payload = await classroomsRes.json();
      setClassrooms(payload.classrooms ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void loadData();
  }, [filter]);

  const matchingClassrooms = useMemo(() => {
    if (!approveTarget) return [];
    return classrooms.filter((c) => c.hskLevel === approveTarget.targetLevel);
  }, [approveTarget, classrooms]);

  const handleReject = async (promotionId: string) => {
    setActionId(promotionId);
    await fetch(`/api/admin/promotions/${promotionId}/reject`, { method: "PATCH" });
    await loadData();
    setActionId(null);
  };

  const handleApprove = async () => {
    if (!approveTarget || !classroomId) return;
    setActionId(approveTarget.id);
    setError(null);

    const response = await fetch(`/api/admin/promotions/${approveTarget.id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classroomId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to approve promotion");
      setActionId(null);
      return;
    }

    setApproveTarget(null);
    setClassroomId("");
    setActionId(null);
    await loadData();
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-emerald-600";
    if (status === "pending") return "bg-amber-600";
    return "bg-red-600";
  };

  return (
    <AdminShell title="HSK Promotions" description="Review teacher promotion requests">
      <div className="mb-6 flex gap-2">
        {["pending", "approved", "rejected", "all"].map((value) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
            className={`rounded-xl capitalize ${
              filter === value ? "bg-[#1e5fa8] text-white hover:bg-[#1a5292]" : ""
            }`}
          >
            {value}
          </Button>
        ))}
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-muted-foreground">Loading...</p>
          ) : promotions.length === 0 ? (
            <p className="p-5 text-muted-foreground">No promotion requests found.</p>
          ) : (
            <div className="divide-y">
              {promotions.map((promotion) => (
                <div key={promotion.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-foreground">{promotion.studentName}</p>
                    <p className="text-sm text-muted-foreground">{promotion.studentEmail}</p>
                    <p className="mt-1 text-sm text-foreground">
                      HSK {promotion.currentLevel} → HSK {promotion.targetLevel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Flagged by {promotion.flaggedByName} ·{" "}
                      {new Date(promotion.createdAt).toLocaleDateString()}
                    </p>
                    {promotion.note ? (
                      <p className="mt-1 text-sm text-muted-foreground">Note: {promotion.note}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-full capitalize text-white ${statusColor(promotion.status)}`}>
                      {promotion.status}
                    </Badge>
                    {promotion.status === "pending" ? (
                      <>
                        <Button
                          onClick={() => {
                            setApproveTarget(promotion);
                            setClassroomId("");
                            setError(null);
                          }}
                          disabled={actionId === promotion.id}
                          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(promotion.id)}
                          disabled={actionId === promotion.id}
                          className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Approve promotion</DialogTitle>
            <DialogDescription>
              Promote {approveTarget?.studentName} to HSK {approveTarget?.targetLevel}. Select the
              target classroom before confirming.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <Label>Target classroom (HSK {approveTarget?.targetLevel})</Label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Select classroom...</option>
              {matchingClassrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.teacherName} · {c.classCode}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              onClick={handleApprove}
              disabled={!classroomId || actionId === approveTarget?.id}
              className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
