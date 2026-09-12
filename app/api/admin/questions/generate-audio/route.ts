import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminApi } from "@/lib/admin/require-admin";
import { HSK_LEVELS } from "@/lib/lms/hsk-levels";
import {
  QUESTION_AUDIO_BUCKET,
  normalizeAnswerForTts,
} from "@/lib/lms/question-audio";
import {
  questionAudioStoragePath,
  synthesizeMandarinMp3,
} from "@/lib/tts/google-tts";

export const maxDuration = 60;

/** Bounded so a batch finishes inside maxDuration; the admin UI loops. */
const BATCH_SIZE = 75;
/**
 * Rows synthesized at once. Six in flight lands near 400 requests/minute
 * against a project limit of 1,000, so there is still ample headroom.
 */
const CONCURRENCY = 6;
const MAX_REPORTED_ERRORS = 5;

type AudioOutcome = "generated" | "reused";

interface PendingQuestion {
  id: string;
  answer: string;
}

/** Assignment A is the only game with a pronunciation hint, so B is skipped. */
function assignmentAQuestions(db: SupabaseClient) {
  return db
    .from("assignment_questions")
    .select("id, answer, assignment:assignments!inner(assignment_key, chapter_id)")
    .neq("assignments.assignment_key", "B");
}

function countAssignmentAQuestions(db: SupabaseClient) {
  return db
    .from("assignment_questions")
    .select("id, assignment:assignments!inner(assignment_key, chapter_id)", {
      count: "exact",
      head: true,
    })
    .neq("assignments.assignment_key", "B");
}

async function countMissingAudio(db: SupabaseClient): Promise<number> {
  const { count, error } = await countAssignmentAQuestions(db).is(
    "audio_path",
    null
  );

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function audioFileExists(
  db: SupabaseClient,
  storagePath: string
): Promise<boolean> {
  const separatorIndex = storagePath.lastIndexOf("/");
  const directory = storagePath.slice(0, separatorIndex);
  const fileName = storagePath.slice(separatorIndex + 1);

  const { data } = await db.storage
    .from(QUESTION_AUDIO_BUCKET)
    .list(directory, { search: fileName, limit: 1 });

  return (data ?? []).some((entry) => entry.name === fileName);
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const db = auth.ctx.db;

    // chapter_id encodes the level (hsk3-ch1), which avoids a second join.
    const perLevelPromises = HSK_LEVELS.map(async (level) => {
      const { count, error } = await countAssignmentAQuestions(db)
        .is("audio_path", null)
        .like("assignments.chapter_id", `hsk${level}-%`);

      if (error) throw new Error(error.message);
      return { hskLevel: level, missing: count ?? 0 };
    });

    const [total, missing, perLevel] = await Promise.all([
      countAssignmentAQuestions(db),
      countMissingAudio(db),
      Promise.all(perLevelPromises),
    ]);

    if (total.error) throw new Error(total.error.message);

    return NextResponse.json({
      total: total.count ?? 0,
      missing,
      perLevel: perLevel.filter((entry) => entry.missing > 0),
      configured: Boolean(process.env.GOOGLE_TTS_CREDENTIALS_B64),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  if (!process.env.GOOGLE_TTS_CREDENTIALS_B64) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_TTS_CREDENTIALS_B64 is not set. Add the base64 service account key to the environment and redeploy.",
      },
      { status: 400 }
    );
  }

  const db = auth.ctx.db;

  try {
    const { data, error } = await assignmentAQuestions(db)
      .is("audio_path", null)
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw new Error(error.message);

    const pending = (data ?? []) as unknown as PendingQuestion[];
    if (pending.length === 0) {
      return NextResponse.json({
        processed: 0,
        generated: 0,
        reused: 0,
        failed: 0,
        remaining: 0,
        errors: [],
      });
    }

    let generated = 0;
    let reused = 0;
    let failed = 0;
    const errors: string[] = [];
    /** Identical answers inside one batch must not synthesize the same file twice. */
    const inFlight = new Map<string, Promise<AudioOutcome>>();

    const ensureAudioFile = async (
      storagePath: string,
      text: string
    ): Promise<AudioOutcome> => {
      const running = inFlight.get(storagePath);
      if (running) {
        await running;
        return "reused";
      }

      const task = (async (): Promise<AudioOutcome> => {
        // Content hashing means identical text across chapters is paid for once.
        if (await audioFileExists(db, storagePath)) {
          return "reused";
        }

        const bytes = await synthesizeMandarinMp3(text);
        const { error: uploadError } = await db.storage
          .from(QUESTION_AUDIO_BUCKET)
          .upload(storagePath, bytes, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);
        return "generated";
      })();

      inFlight.set(storagePath, task);
      return task;
    };

    const processQuestion = async (question: PendingQuestion) => {
      const normalized = normalizeAnswerForTts(question.answer);
      if (!normalized) {
        return { ok: false as const, message: `Question ${question.id} has an empty answer.` };
      }

      const storagePath = questionAudioStoragePath(normalized);

      try {
        const outcome = await ensureAudioFile(storagePath, normalized);

        const { error: updateError } = await db
          .from("assignment_questions")
          .update({ audio_path: storagePath })
          .eq("id", question.id);

        if (updateError) throw new Error(updateError.message);
        return { ok: true as const, outcome };
      } catch (rowError) {
        const message = rowError instanceof Error ? rowError.message : "Unknown error";
        return { ok: false as const, message: `${normalized.slice(0, 12)}: ${message}` };
      }
    };

    for (let offset = 0; offset < pending.length; offset += CONCURRENCY) {
      const chunk = pending.slice(offset, offset + CONCURRENCY);
      const results = await Promise.all(chunk.map(processQuestion));

      for (const result of results) {
        if (!result.ok) {
          failed += 1;
          if (errors.length < MAX_REPORTED_ERRORS) {
            errors.push(result.message);
          }
          continue;
        }
        if (result.outcome === "generated") generated += 1;
        else reused += 1;
      }

      // Credential and quota failures repeat for every row; stop the batch.
      if (generated === 0 && reused === 0) {
        return NextResponse.json(
          { error: errors[0] ?? "Audio generation failed." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      processed: pending.length,
      generated,
      reused,
      failed,
      remaining: await countMissingAudio(db),
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
