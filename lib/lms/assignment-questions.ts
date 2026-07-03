import type { SupabaseClient } from "@supabase/supabase-js";
import { type MandarinTypingQuestion } from "@/lib/mandarin-typing-questions";
import { isValidHskLevel, hskLevelRangeLabel } from "@/lib/lms/hsk-levels";

export type AssignmentKey = "A1" | "A2" | "A3" | "B";

export const ASSIGNMENT_KEYS: AssignmentKey[] = ["A1", "A2", "A3", "B"];

export const CSV_COLUMNS_A = [
  "hsk_level",
  "chapter_id",
  "assignment_key",
  "question_order",
  "answer",
  "pinyin_hint",
  "meaning_hint",
] as const;

const A_ASSIGNMENT_KEYS: AssignmentKey[] = ["A1", "A2", "A3"];

export interface AssignmentQuestionRow {
  id: string;
  assignment_id: string;
  question_order: number;
  answer: string;
  pinyin_hint: string | null;
  meaning_hint: string | null;
}

export interface ParsedQuestionCsvRow {
  hsk_level: number;
  chapter_id: string;
  assignment_key: AssignmentKey;
  question_order: number;
  answer: string;
  pinyin_hint?: string;
  meaning_hint?: string;
}

export interface CsvValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportSummary {
  imported: number;
  assignmentsReplaced: number;
  errors: CsvValidationError[];
}

interface AssignmentLookup {
  id: string;
  chapter_id: string;
  assignment_key: AssignmentKey;
}

function isAssignmentKey(value: string): value is AssignmentKey {
  return ASSIGNMENT_KEYS.includes(value as AssignmentKey);
}

function parseChapterLevel(chapterId: string): number | null {
  const match = chapterId.match(/^hsk(\d+)-ch\d+$/i);
  if (!match) return null;
  const level = parseInt(match[1], 10);
  return Number.isNaN(level) ? null : level;
}

export function toMandarinTypingQuestions(
  rows: AssignmentQuestionRow[]
): MandarinTypingQuestion[] {
  return rows
    .slice()
    .sort((a, b) => a.question_order - b.question_order)
    .map((row, index) => ({
      id: index + 1,
      answer: row.answer,
      meaningHintId: row.meaning_hint ?? "",
      pinyinHint: row.pinyin_hint ?? "",
    }));
}

export function toWordPool(rows: AssignmentQuestionRow[]): string[] {
  return rows
    .slice()
    .sort((a, b) => a.question_order - b.question_order)
    .map((row) => row.answer);
}

export async function getQuestionCountsByAssignmentIds(
  supabase: SupabaseClient,
  assignmentIds: string[]
): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(assignmentIds)];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("assignment_questions")
    .select("assignment_id")
    .in("assignment_id", uniqueIds);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.assignment_id, (counts.get(row.assignment_id) ?? 0) + 1);
  }
  return counts;
}

export async function resolveAssignmentId(
  supabase: SupabaseClient,
  chapterId: string,
  assignmentKey: AssignmentKey
): Promise<string | null> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("assignment_key", assignmentKey)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

export async function getCombinedAQuestionsForChapter(
  supabase: SupabaseClient,
  chapterId: string
): Promise<AssignmentQuestionRow[]> {
  const allRows: AssignmentQuestionRow[] = [];

  for (const assignmentKey of A_ASSIGNMENT_KEYS) {
    const rows = await getQuestionsForAssignment(supabase, chapterId, assignmentKey);
    allRows.push(...rows);
  }

  return allRows;
}

export async function getQuestionsForAssignment(
  supabase: SupabaseClient,
  chapterId: string,
  assignmentKey: AssignmentKey
): Promise<AssignmentQuestionRow[]> {
  const { data, error } = await supabase
    .from("assignment_questions")
    .select(
      `
      id,
      assignment_id,
      question_order,
      answer,
      pinyin_hint,
      meaning_hint,
      assignment:assignments!inner(chapter_id, assignment_key)
    `
    )
    .eq("assignments.chapter_id", chapterId)
    .eq("assignments.assignment_key", assignmentKey)
    .order("question_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function validateQuestionCsv(
  headers: string[],
  rows: Record<string, string>[]
): { validRows: ParsedQuestionCsvRow[]; errors: CsvValidationError[] } {
  const errors: CsvValidationError[] = [];
  const validRows: ParsedQuestionCsvRow[] = [];

  if (headers.length === 0) {
    errors.push({ row: 0, message: "CSV file is empty or has no header row." });
    return { validRows, errors };
  }

  const hasAFormat = headers.length === CSV_COLUMNS_A.length &&
    CSV_COLUMNS_A.every((col) => headers.includes(col));

  if (!hasAFormat) {
    const expected = `Expected columns: ${CSV_COLUMNS_A.join(", ")} (A1–A3 only). Assignment B is generated automatically from A1, A2, and A3.`;
    errors.push({ row: 0, message: `Unknown columns. ${expected}` });
    return { validRows, errors };
  }

  const allowedHeaders = new Set(CSV_COLUMNS_A);
  for (const header of headers) {
    if (!allowedHeaders.has(header as (typeof CSV_COLUMNS_A)[number])) {
      errors.push({ row: 0, field: header, message: `Unknown column "${header}".` });
    }
  }
  if (errors.length > 0) return { validRows, errors };

  if (rows.length === 0) {
    errors.push({ row: 0, message: "CSV has no data rows." });
    return { validRows, errors };
  }

  const seenKeys = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const hskLevelRaw = row.hsk_level ?? "";
    const hskLevel = parseInt(hskLevelRaw, 10);
    if (!hskLevelRaw || !isValidHskLevel(hskLevel)) {
      errors.push({ row: rowNumber, field: "hsk_level", message: `hsk_level must be an integer from ${hskLevelRangeLabel()}.` });
      return;
    }

    const chapterId = row.chapter_id ?? "";
    if (!chapterId) {
      errors.push({ row: rowNumber, field: "chapter_id", message: "chapter_id is required." });
      return;
    }

    const chapterLevel = parseChapterLevel(chapterId);
    if (chapterLevel === null) {
      errors.push({ row: rowNumber, field: "chapter_id", message: `Invalid chapter_id format "${chapterId}". Expected e.g. hsk1-ch1.` });
      return;
    }
    if (chapterLevel !== hskLevel) {
      errors.push({
        row: rowNumber,
        field: "chapter_id",
        message: `chapter_id "${chapterId}" does not match hsk_level ${hskLevel}.`,
      });
      return;
    }

    const assignmentKey = row.assignment_key ?? "";
    if (!isAssignmentKey(assignmentKey)) {
      errors.push({ row: rowNumber, field: "assignment_key", message: "assignment_key must be A1, A2, A3, or B." });
      return;
    }

    if (assignmentKey === "B") {
      errors.push({
        row: rowNumber,
        field: "assignment_key",
        message: "Assignment B is generated automatically from A1, A2, and A3 for the same chapter.",
      });
      return;
    }

    const orderRaw = row.question_order ?? "";
    const questionOrder = parseInt(orderRaw, 10);
    if (!orderRaw || Number.isNaN(questionOrder) || questionOrder < 1) {
      errors.push({ row: rowNumber, field: "question_order", message: "question_order must be a positive integer." });
      return;
    }

    const answer = row.answer ?? "";
    if (!answer) {
      errors.push({ row: rowNumber, field: "answer", message: "answer is required." });
      return;
    }

    const scopeKey = `${chapterId}:${assignmentKey}:${questionOrder}`;
    if (seenKeys.has(scopeKey)) {
      errors.push({
        row: rowNumber,
        field: "question_order",
        message: `Duplicate question_order ${questionOrder} for ${chapterId} ${assignmentKey}.`,
      });
      return;
    }
    seenKeys.add(scopeKey);

    const pinyinHint = row.pinyin_hint ?? "";
    const meaningHint = row.meaning_hint ?? "";
    if (!pinyinHint) {
      errors.push({ row: rowNumber, field: "pinyin_hint", message: "pinyin_hint is required for A1–A3." });
      return;
    }
    if (!meaningHint) {
      errors.push({ row: rowNumber, field: "meaning_hint", message: "meaning_hint is required for A1–A3." });
      return;
    }
    validRows.push({
      hsk_level: hskLevel,
      chapter_id: chapterId,
      assignment_key: assignmentKey,
      question_order: questionOrder,
      answer,
      pinyin_hint: pinyinHint,
      meaning_hint: meaningHint,
    });
  });

  return { validRows, errors };
}

const IMPORT_INSERT_CHUNK_SIZE = 500;

async function loadChapterIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from("hsk_chapters").select("id");
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row) => row.id));
}

async function loadAssignmentMap(supabase: SupabaseClient): Promise<Map<string, AssignmentLookup>> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, chapter_id, assignment_key");

  if (error) throw new Error(error.message);

  const map = new Map<string, AssignmentLookup>();
  for (const row of data ?? []) {
    if (!isAssignmentKey(row.assignment_key)) continue;
    map.set(`${row.chapter_id}:${row.assignment_key}`, {
      id: row.id,
      chapter_id: row.chapter_id,
      assignment_key: row.assignment_key,
    });
  }
  return map;
}

async function insertQuestionRowsInChunks(
  supabase: SupabaseClient,
  rows: {
    assignment_id: string;
    question_order: number;
    answer: string;
    pinyin_hint: string | null;
    meaning_hint: string | null;
  }[]
): Promise<void> {
  for (let i = 0; i < rows.length; i += IMPORT_INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + IMPORT_INSERT_CHUNK_SIZE);
    const { error } = await supabase.from("assignment_questions").insert(chunk);
    if (error) throw new Error(error.message);
  }
}

async function syncAssignmentBForChapters(
  supabase: SupabaseClient,
  chapterIds: string[],
  assignmentMap: Map<string, AssignmentLookup>
): Promise<void> {
  const uniqueChapterIds = [...new Set(chapterIds)];

  for (const chapterId of uniqueChapterIds) {
    const bAssignment = assignmentMap.get(`${chapterId}:B`);
    if (!bAssignment) continue;

    const combinedRows = await getCombinedAQuestionsForChapter(supabase, chapterId);

    const { error: deleteError } = await supabase
      .from("assignment_questions")
      .delete()
      .eq("assignment_id", bAssignment.id);

    if (deleteError) throw new Error(deleteError.message);

    if (combinedRows.length === 0) continue;

    const inserts = combinedRows.map((row, index) => ({
      assignment_id: bAssignment.id,
      question_order: index + 1,
      answer: row.answer,
      pinyin_hint: null,
      meaning_hint: null,
    }));

    await insertQuestionRowsInChunks(supabase, inserts);
  }
}

export async function importQuestionRows(
  supabase: SupabaseClient,
  uploadedBy: string,
  rows: ParsedQuestionCsvRow[]
): Promise<ImportSummary> {
  const [chapterIds, assignmentMap] = await Promise.all([
    loadChapterIds(supabase),
    loadAssignmentMap(supabase),
  ]);
  const errors: CsvValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!chapterIds.has(row.chapter_id)) {
      errors.push({
        row: i + 2,
        field: "chapter_id",
        message: `chapter_id "${row.chapter_id}" does not exist in hsk_chapters.`,
      });
    }
    if (!assignmentMap.has(`${row.chapter_id}:${row.assignment_key}`)) {
      errors.push({
        row: i + 2,
        field: "assignment_key",
        message: `No assignment found for ${row.chapter_id} ${row.assignment_key}.`,
      });
    }
  }

  if (errors.length > 0) {
    return { imported: 0, assignmentsReplaced: 0, errors };
  }

  const grouped = new Map<string, ParsedQuestionCsvRow[]>();
  for (const row of rows) {
    const key = `${row.chapter_id}:${row.assignment_key}`;
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  const assignmentIds = [...grouped.keys()]
    .map((scopeKey) => assignmentMap.get(scopeKey)?.id)
    .filter((id): id is string => Boolean(id));

  if (assignmentIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("assignment_questions")
      .delete()
      .in("assignment_id", assignmentIds);

    if (deleteError) throw new Error(deleteError.message);
  }

  const allInserts: {
    assignment_id: string;
    question_order: number;
    answer: string;
    pinyin_hint: string | null;
    meaning_hint: string | null;
  }[] = [];

  for (const [scopeKey, groupRows] of grouped) {
    const assignment = assignmentMap.get(scopeKey);
    if (!assignment) continue;

    const inserts = groupRows
      .slice()
      .sort((a, b) => a.question_order - b.question_order)
      .map((row) => ({
        assignment_id: assignment.id,
        question_order: row.question_order,
        answer: row.answer,
        pinyin_hint: row.pinyin_hint ?? null,
        meaning_hint: row.meaning_hint ?? null,
      }));

    allInserts.push(...inserts);
  }

  await insertQuestionRowsInChunks(supabase, allInserts);
  const imported = allInserts.length;

  const chaptersToSyncB = [
    ...new Set(
      rows
        .filter((row) => A_ASSIGNMENT_KEYS.includes(row.assignment_key))
        .map((row) => row.chapter_id)
    ),
  ];
  await syncAssignmentBForChapters(supabase, chaptersToSyncB, assignmentMap);

  await supabase.from("question_import_batches").insert({
    uploaded_by: uploadedBy,
    row_count: imported,
    assignment_count: grouped.size,
  });

  return { imported, assignmentsReplaced: grouped.size, errors: [] };
}

export function assignmentCsvTemplate(): string {
  return [
    CSV_COLUMNS_A.join(","),
    "1,hsk1-ch1,A1,1,你好,ni hao,Halo",
    "1,hsk1-ch1,A1,2,谢谢,xie xie,Terima kasih",
  ].join("\n");
}
