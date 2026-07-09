import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canAccessChapterMaterial } from "@/lib/lms/chapter-materials-access";
import {
  downloadChapterMaterialBytes,
  getChapterMaterial,
} from "@/lib/lms/chapter-materials";

function pdfResponse(
  bytes: ArrayBuffer,
  fileName: string,
  download: boolean
): NextResponse {
  const safeFileName = fileName.replace(/[^\w.\-() ]+/g, "_") || "chapter-material.pdf";
  const disposition = download
    ? `attachment; filename="${safeFileName}"`
    : `inline; filename="${safeFileName}"`;

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  const download = new URL(request.url).searchParams.get("download") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canAccessChapterMaterial(supabase, user.id, chapterId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminDb = createAdminClient();
  const material = await getChapterMaterial(adminDb, chapterId);
  if (!material) {
    return NextResponse.json({ error: "Material not found." }, { status: 404 });
  }

  const file = await downloadChapterMaterialBytes(adminDb, material);
  if ("error" in file) {
    return NextResponse.json({ error: file.error }, { status: 404 });
  }

  return pdfResponse(file.bytes, file.fileName, download);
}
