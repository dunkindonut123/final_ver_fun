import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AdminApprovalContent } from "@/components/admin/admin-approval-content";

interface TeacherRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: string;
  created_at: string;
}

export default async function AdminApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const adminUrlToken = process.env.ADMIN_URL_TOKEN;
  const approvalToken = process.env.ADMIN_APPROVAL_TOKEN ?? adminUrlToken;

  if (!adminUrlToken || !approvalToken || token !== adminUrlToken) {
    notFound();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    notFound();
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("teacher_requests")
    .select("id, name, email, message, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load teacher requests:", error.message);
  }

  const requests: TeacherRequest[] = (data ?? []) as TeacherRequest[];

  return <AdminApprovalContent requests={requests} token={approvalToken} />;
}
