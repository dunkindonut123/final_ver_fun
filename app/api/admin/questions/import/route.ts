import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { parseCsv } from "@/lib/lms/csv-parser";
import { importQuestionRows, validateQuestionCsv } from "@/lib/lms/assignment-questions";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = typeof body.csv === "string" ? body.csv : "";
      if (!csvText) {
        return NextResponse.json({ error: "CSV content is required." }, { status: 400 });
      }
    }

    const parsed = parseCsv(csvText);
    const { validRows, errors } = validateQuestionCsv(parsed.headers, parsed.rows);

    if (errors.length > 0) {
      return NextResponse.json({ imported: 0, assignmentsReplaced: 0, errors }, { status: 400 });
    }

    const result = await importQuestionRows(auth.ctx.db, auth.ctx.userId, validRows);
    if (result.errors.length > 0) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
