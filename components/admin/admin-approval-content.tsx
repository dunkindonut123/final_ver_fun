"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Check,
  X,
  Loader2,
  Mail,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TeacherRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: string;
  created_at: string;
}

interface AdminApprovalContentProps {
  requests: TeacherRequest[];
  token: string;
}

export function AdminApprovalContent({
  requests: initialRequests,
  token,
}: AdminApprovalContentProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] =
    useState<TeacherRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/approve-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: actionType,
          token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));

        setSelectedRequest(null);
        setActionType(null);
        router.refresh();
      } else {
        setError(data.error + (data.details ? `: ${data.details}` : ""));
      }
    } catch (err) {
      console.log("[admin] Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (
    request: TeacherRequest,
    action: "approve" | "reject"
  ) => {
    setSelectedRequest(request);
    setActionType(action);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Teacher Approval System</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Pending Teacher Requests</h2>
          <p className="text-muted-foreground">
            Review and approve or reject teacher registration requests
          </p>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Check className="mx-auto mb-4 h-12 w-12 text-accent" />
              <p className="text-lg font-medium text-card-foreground">All caught up!</p>
              <p className="text-muted-foreground">
                No pending teacher requests at the moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-card-foreground">{request.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {request.email}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(request.created_at)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {request.message && (
                    <div className="mb-4 rounded-lg bg-secondary p-3">
                      <p className="mb-1 text-sm font-medium text-secondary-foreground">Message:</p>
                      <p className="text-sm text-muted-foreground">{request.message}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => openConfirmDialog(request, "approve")}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openConfirmDialog(request, "reject")}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {actionType === "approve" ? "Approve Teacher" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" ? (
                <>
                  Are you sure you want to approve <strong>{selectedRequest?.name}</strong> as a
                  teacher? Their existing account will be activated for sign in.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{selectedRequest?.name}</strong>&apos;s
                  request? This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={loading}
              className={
                actionType === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-accent text-accent-foreground hover:bg-accent/90"
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionType === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
