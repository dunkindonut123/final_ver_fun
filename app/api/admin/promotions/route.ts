import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { fetchAdminPromotions, parsePromotionStatus } from "@/lib/admin/queries/promotions";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = parsePromotionStatus(searchParams.get("status"));
    const promotions = await fetchAdminPromotions(auth.ctx.db, status);
    return NextResponse.json({ promotions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
