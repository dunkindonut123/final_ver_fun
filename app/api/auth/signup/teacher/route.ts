import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? "Unable to create account." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      email,
      full_name: name,
      role: "teacher",
      status: "pending",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { error: requestError } = await admin.from("teacher_requests").insert({
      name,
      email,
      message: null,
    });

    if (requestError && requestError.code !== "23505") {
      // Non-duplicate failure: roll back the auth user + profile.
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: requestError.message }, { status: 500 });
    }

    // TODO: send confirmation email to the teacher once an email provider is configured.

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
