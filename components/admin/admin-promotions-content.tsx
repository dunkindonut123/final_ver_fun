"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import type { AdminClassroomRow } from "@/lib/admin/queries/classrooms";
import type {
  AdminPromotionRow,
  AdminPromotionStatus,
} from "@/lib/admin/queries/promotions";
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

type ClassroomOption = Pick<
  AdminClassroomRow,
  "id" | "name" | "classCode" | "hskLevel" | "teacherName"
>;

interface AdminPromotionsContentProps {
  initialPromotions: AdminPromotionRow[];
  initialClassrooms: ClassroomOption[];
  initialFilter: AdminPromotionStatus;
}

export function AdminPromotionsContent({
  initialPromotions,
  initialClassrooms,
  initialFilter,
}: AdminPromotionsContentProps) {
  const router = useRouter();
  const [promotions, setPromotions] = useState(initialPromotions);
  const [classrooms, setClassrooms] = useState(initialClassrooms);
  const [filter, setFilter] = useState(initialFilter);
  const [approveTarget, setApproveTarget] = useState<AdminPromotionRow | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    setPromotions(initialPromotions);
    setClassrooms(initialClassrooms);
    setFilter(initialFilter);
  }, [initialPromotions, initialClassrooms, initialFilter]);

  const matchingClassrooms = useMemo(() => {
    if (!approveTarget) return [];
    return classrooms.filter((c) => c.hskLevel === approveTarget.targetLevel);
  }, [approveTarget, classrooms]);

  const handleReject = async (promotionId: string) => {
    setActionId(promotionId);
    setActionType("reject");
    await fetch(`/api/admin/promotions/${promotionId}/reject`, { method: "PATCH" });
    setActionId(null);
    setActionType(null);
    router.refresh();
  };

  const handleApprove = async () => {
    if (!approveTarget || !classroomId) return;
    setActionId(approveTarget.id);
    setActionType("approve");
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
      setActionType(null);
      return;
    }

    setApproveTarget(null);
    setClassroomId("");
    setActionId(null);
    setActionType(null);
    router.refresh();
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "bg-emerald-600";
    if (status === "pending") return "bg-amber-600";
    return "bg-red-600";
  };

  const filterHref = (value: string) =>
    value === "pending" ? "/admin/promotions" : `/admin/promotions?status=${value}`;

  return (
    <>
      <AdminPageHeader title="HSK Promotions" description="Review teacher promotion requests" />
      <div className="mb-6 flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((value) => (
          <Button
            key={value}
            asChild
            variant={filter === value ? "default" : "outline"}
            className={`rounded-xl capitalize ${
              filter === value ? "bg-[#1e5fa8] text-white hover:bg-[#1a5292]" : ""
            }`}
          >
            <Link href={filterHref(value)}>{value}</Link>
          </Button>
        ))}
      </div>

      <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <CardContent className="p-0">
          {promotions.length === 0 ? (
            <p className="p-5 text-muted-foreground">No promotion requests found.</p>
          ) : (
            <div className="divide-y">
              {promotions.map((promotion) => {
                const isActing = actionId === promotion.id;
                return (
                  <div
                    key={promotion.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                  >
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
                            disabled={isActing}
                            className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(promotion.id)}
                            disabled={isActing}
                            className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                          >
                            {isActing && actionType === "reject" ? "Rejecting..." : "Reject"}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
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
              {actionId === approveTarget?.id && actionType === "approve"
                ? "Approving..."
                : "Confirm approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
