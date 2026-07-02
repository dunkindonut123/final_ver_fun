"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface PendingPromotion {
  id: string;
  studentName: string;
  currentLevel: number;
  targetLevel: number;
  flaggedByName: string;
  createdAt: string;
}

export function AdminDashboardContent() {
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [pendingPromotions, setPendingPromotions] = useState<PendingPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = async () => {
    const [teachersRes, promotionsRes] = await Promise.all([
      fetch("/api/admin/teachers"),
      fetch("/api/admin/promotions?status=pending"),
    ]);

    if (teachersRes.ok) {
      const payload = await teachersRes.json();
      setPendingTeachers(
        (payload.teachers ?? [])
          .filter((t: { status: string }) => t.status === "pending")
          .map((t: { id: string; full_name: string | null; email: string; created_at: string }) => ({
            id: t.id,
            name: t.full_name ?? "Teacher",
            email: t.email,
            createdAt: t.created_at,
          }))
      );
    }

    if (promotionsRes.ok) {
      const payload = await promotionsRes.json();
      setPendingPromotions(
        (payload.promotions ?? []).map(
          (p: {
            id: string;
            studentName: string;
            currentLevel: number;
            targetLevel: number;
            flaggedByName: string;
            createdAt: string;
          }) => p
        )
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAction = async (teacherId: string, action: "approve" | "reject") => {
    setActionId(teacherId);
    const response = await fetch(`/api/admin/teachers/${teacherId}/${action}`, { method: "PATCH" });
    if (response.ok) {
      await loadData();
    }
    setActionId(null);
  };

  return (
    <AdminShell
      title="Admin Dashboard"
      description="Teacher approvals and HSK promotion requests"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
          <CardContent className="p-0">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-foreground">Pending teacher approvals</h2>
            </div>
            {loading ? (
              <p className="p-5 text-muted-foreground">Loading...</p>
            ) : pendingTeachers.length === 0 ? (
              <p className="p-5 text-muted-foreground">No pending teacher requests.</p>
            ) : (
              <div className="divide-y">
                {pendingTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
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
                        disabled={actionId === teacher.id}
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAction(teacher.id, "reject")}
                        disabled={actionId === teacher.id}
                        className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
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
            {loading ? (
              <p className="p-5 text-muted-foreground">Loading...</p>
            ) : pendingPromotions.length === 0 ? (
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
    </AdminShell>
  );
}
