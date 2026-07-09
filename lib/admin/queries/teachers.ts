import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminTeacherRow = {
  id: string;
  full_name: string | null;
  email: string;
  status: string;
  created_at: string;
};

export async function fetchAdminTeachers(db: SupabaseClient): Promise<AdminTeacherRow[]> {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, email, status, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
