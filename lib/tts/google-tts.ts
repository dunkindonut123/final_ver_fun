import { createHash } from "node:crypto";
import { GoogleAuth } from "google-auth-library";

/** Neutral textbook Mandarin, SSML-capable, cheaper tier than Chirp 3. */
export const TTS_VOICE_NAME = "cmn-CN-Wavenet-A";
export const TTS_LANGUAGE_CODE = "cmn-CN";
/** Generated at natural speed; slow replay is a client-side playbackRate choice. */
export const TTS_SPEAKING_RATE = 1;

/** Cloud TTS rejects API keys and plain ADC user credentials; this scope is required. */
const TTS_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const SYNTHESIZE_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
/** Requests cap at 5,000 bytes; a one-sentence answer uses well under 1%. */
const MAX_TEXT_BYTES = 4500;

let cachedAuth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;

  const encoded = process.env.GOOGLE_TTS_CREDENTIALS_B64;
  if (!encoded) {
    throw new Error(
      "Missing GOOGLE_TTS_CREDENTIALS_B64. Base64-encode the service account JSON key into that env var."
    );
  }

  let credentials: { client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    throw new Error("GOOGLE_TTS_CREDENTIALS_B64 is not valid base64-encoded JSON.");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "GOOGLE_TTS_CREDENTIALS_B64 is missing client_email or private_key. Use a service account key, not an OAuth client."
    );
  }

  cachedAuth = new GoogleAuth({ credentials, scopes: [TTS_SCOPE] });
  return cachedAuth;
}

/**
 * Content-addressed path: text + voice + rate. CSV import deletes and re-inserts
 * rows, so UUID-keyed files would be orphaned on every upload. Hashing lets
 * unchanged text reuse existing audio and duplicate answers share one file.
 */
export function questionAudioStoragePath(normalizedText: string): string {
  const hash = createHash("sha256")
    .update(`${TTS_VOICE_NAME}:${TTS_SPEAKING_RATE}:${normalizedText}`)
    .digest("hex");

  return `${hash.slice(0, 2)}/${hash.slice(0, 32)}.mp3`;
}

export async function synthesizeMandarinMp3(text: string): Promise<Buffer> {
  if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
    throw new Error("Answer is too long for a single Cloud TTS request.");
  }

  const accessToken = await getAuth().getAccessToken();
  if (!accessToken) {
    throw new Error("Could not mint a Google access token for Cloud TTS.");
  }

  const response = await fetch(SYNTHESIZE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: TTS_LANGUAGE_CODE, name: TTS_VOICE_NAME },
      audioConfig: { audioEncoding: "MP3", speakingRate: TTS_SPEAKING_RATE },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google TTS ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { audioContent?: string };
  if (!payload.audioContent) {
    throw new Error("Google TTS returned no audio content.");
  }

  return Buffer.from(payload.audioContent, "base64");
}
