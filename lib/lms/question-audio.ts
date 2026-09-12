export const QUESTION_AUDIO_BUCKET = "question-audio";

/**
 * WaveNet uses punctuation for phrasing and pauses, so unlike the device-TTS
 * fallback the full answer is sent as written — only whitespace is tidied.
 */
export function normalizeAnswerForTts(answer: string): string {
  return answer.replace(/\s+/gu, " ").trim();
}

/** Public bucket, so playback needs no signing round-trip. */
export function questionAudioPublicUrl(
  audioPath: string | null | undefined
): string | null {
  if (!audioPath) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;

  return `${baseUrl}/storage/v1/object/public/${QUESTION_AUDIO_BUCKET}/${audioPath}`;
}
