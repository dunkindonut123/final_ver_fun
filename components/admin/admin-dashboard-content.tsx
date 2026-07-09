"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import type { AdminPromotionRow } from "@/lib/admin/queries/promotions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

type PendingPromotion = Pick<
  AdminPromotionRow,
  "id" | "studentName" | "currentLevel" | "targetLevel" | "flaggedByName" | "createdAt"
>;

interface AdminDashboardContentProps {
  pendingTeachers: PendingTeacher[];
  pendingPromotions: PendingPromotion[];
}

export function AdminDashboardContent({
  pendingTeachers: initialPendingTeachers,
  pendingPromotions: initialPendingPromotions,
}: AdminDashboardContentProps) {
  const router = useRouter();
  const [pendingTeachers, setPendingTeachers] = useState(initialPendingTeachers);
  const [pendingPromotions, setPendingPromotions] = useState(initialPendingPromotions);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    setPendingTeachers(initialPendingTeachers);
    setPendingPromotions(initialPendingPromotions);
  }, [initialPendingTeachers, initialPendingPromotions]);

  const handleAction = async (teacherId: string, action: "approve" | "reject") => {
    setActionId(teacherId);
    setActionType(action);
    const response = await fetch(`/api/admin/teachers/${teacherId}/${action}`, { method: "PATCH" });
    if (response.ok) {
      router.refresh();
    }
    setActionId(null);
    setActionType(null);
  };

  return (
    <>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Teacher approvals and HSK promotion requests"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
          <CardContent className="p-0">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-foreground">Pending teacher approvals</h2>
            </div>
            {pendingTeachers.length === 0 ? (
              <p className="p-5 text-muted-foreground">No pending teacher requests.</p>
            ) : (
              <div className="divide-y">
                {pendingTeachers.map((teacher) => {
                  const isActing = actionId === teacher.id;
                  return (
                    <div
                      key={teacher.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {new Date(teacher.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(teacher.id, "approve")}
                          disabled={isActing}
                          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {isActing && actionType === "approve" ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(teacher.id, "reject")}
                          disabled={isActing}
                          className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                        >
                          {isActing && actionType === "reject" ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Rejecting...
                            </>
                          ) : (
                            "Reject"
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold text-foreground">Pending HSK promotions</h2>
              <Link href="/admin/promotions" className="text-sm font-medium text-[#1e5fa8] hover:underline">
                View all
              </Link>
            </div>
            {pendingPromotions.length === 0 ? (
              <p className="p-5 text-muted-foreground">No pending promotion requests.</p>
            ) : (
              <div className="divide-y">
                {pendingPromotions.slice(0, 5).map((promotion) => (
                  <div key={promotion.id} className="px-5 py-4">
                    <p className="font-medium text-foreground">{promotion.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      HSK {promotion.currentLevel} → HSK {promotion.targetLevel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Flagged by {promotion.flaggedByName} ·{" "}
                      {new Date(promotion.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
