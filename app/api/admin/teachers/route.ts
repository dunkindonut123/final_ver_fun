import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.ctx.db
    .from("profiles")
    .select("id, full_name, email, status, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ teachers: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { data: authData, error: signUpError } = await auth.ctx.db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? "Unable to create teacher account." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const { error: profileError } = await auth.ctx.db.from("profiles").insert({
      id: userId,
      email,
      full_name: name,
      role: "teacher",
      status: "active",
    });

    if (profileError) {
      await auth.ctx.db.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: teacherError } = await auth.ctx.db.from("teachers").insert({
      user_id: userId,
      teacher_code: null,
    });

    if (teacherError) {
      await auth.ctx.db.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: teacherError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      teacher: { id: userId, email, full_name: name, status: "active" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
