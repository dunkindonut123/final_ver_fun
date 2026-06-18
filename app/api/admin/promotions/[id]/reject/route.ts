import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id: promotionId } = await params;

    const { data: flag, error: flagError } = await auth.ctx.db
      .from("promotion_flags")
      .select("id, status")
      .eq("id", promotionId)
      .single();

    if (flagError || !flag) {
      return NextResponse.json({ error: "Promotion request not found" }, { status: 404 });
    }

    if (flag.status !== "pending") {
      return NextResponse.json({ error: "This promotion has already been reviewed." }, { status: 400 });
    }

    const { error: updateError } = await auth.ctx.db
      .from("promotion_flags")
      .update({ status: "rejected" })
      .eq("id", promotionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
