# Assignment A Pronunciation Audio — Investigation & Plan

Date: 2026-09-03

## The reported problem

The Assignment A pronunciation hint sounds correct on the developer's laptop and iPhone,
but students report the audio being wrong and "alien" sounding.

Reported characteristics (collected during investigation):

- Recognizably Chinese, but **robotic / warbly**, not foreign-accented.
- The "Hear Pronunciation" button **sometimes plays nothing at all**.
- Complaints come from **both Android and iPhone** users.
- Wrong **every time**, on every question, for affected users.
- **HSK 3 only.** HSK 1 and HSK 2 are reported normal.
- Developer's own iPhone uses the **basic (compact) Ting-Ting** voice, i.e. the same
  low-end voice students have.

## How the feature works today

There are **no audio files in the project**. Pronunciation is synthesized on the
student's own device at play time via the Web Speech API.

- `components/mandarin-typing-game.tsx` → `playPronunciation()` builds a
  `SpeechSynthesisUtterance` from `currentQuestion.answer` (the hanzi), sets
  `lang = "zh-CN"` and `rate = 0.3`, picks a voice via `pickFluentMandarinVoice()`,
  then calls `window.speechSynthesis.speak()`.
- Playback is triggered by the "Hear Pronunciation" button and by an autoplay
  effect that fires when each question mounts.
- `ARCHITECTURE_PERFORMANCE_AUDIT.md` already noted this: "No stored audio files found —
  pronunciation uses browser `speechSynthesis` with `zh-CN` utterances."

Consequence: the app does not produce the sound. Each device's TTS engine does.
The output cannot be observed, reproduced, or verified from the app side.

## Hypotheses tested and ruled out

| Hypothesis | Ruled out by |
| --- | --- |
| Students lack a Chinese voice, or have a lower-quality one than the developer | Developer is on basic/compact Ting-Ting too — same low-end voice |
| App fails to bind a Chinese voice, so an English/Indonesian voice reads the hanzi | Users describe the audio as recognizably Chinese, not foreign-accented |
| Voice-list race condition on first load | Problem is consistent on every question; a race would be intermittent |
| Platform-specific iOS or Android bug | Both platforms affected |
| Punctuation or sentence length in the answers | HSK 1 and 2 have the same sentence-with-punctuation shape and sound fine |
| Corrupted / oddly-encoded HSK 3 rows | Codepoint audit (below) — HSK 3 is *cleaner* than HSK 1 |

### Codepoint audit result

A per-level dump of all non-CJK codepoints in `assignment_questions.answer` showed no
anomaly in HSK 3:

- HSK 3 contains only `。， ？ ！ 、 ? . ,` and 16 plain spaces (14 rows).
- HSK 1 contains **more** oddities — an ideographic space (U+3000), stray digits
  (`0`–`9`), and mixed ASCII/fullwidth punctuation — and works fine.
- No zero-width characters, non-breaking spaces, Latin contamination, or traditional
  characters anywhere.
- HSK 3 is mostly single-clause (188 `。` / 41 `，`); HSK 2 is more clause-heavy
  (117 `。` / 114 `，`). Sentence complexity does not separate them.

### Why no code-level cause explains "HSK 3 only"

The audio path has **no branch on `hskLevel`**. `components/student/assignment-game-router.tsx`
routes every Assignment A level into the same `MandarinTypingGame`, with the same voice
picker, the same `rate = 0.3`, and the same text handling. `hskLevel` is used only for
progress and scoring.

## Remaining hypothesis (unconfirmed)

Compact on-device voices ship a small pronunciation dictionary. Words outside it are read
character-by-character using each character's default reading, which loses word-level
prosody and tone sandhi and picks wrong readings for polyphonic characters (多音字 —
e.g. 了 `le`/`liǎo`, 得 `de`/`dé`/`děi`, 还 `hái`/`huán`). HSK 1–2 vocabulary is
high-frequency and certainly in every lexicon; HSK 3 is roughly where coverage falls off.

This fits every reported symptom, but it is the last hypothesis standing by elimination.
It cannot be confirmed from the codebase, and cannot be confirmed by the developer either,
because there is no affected device available to reproduce on.

## Step 0 — Validate the HSK 3 boundary (gates the diagnosis)

**Do this before anything else. It is the cheapest step available and it can invalidate
the leading hypothesis outright.**

The "HSK 3 only" claim comes entirely from secondhand reports and has never been
reproduced locally. It has not been established whether HSK 1 and 2 are genuinely fine,
or whether only HSK 3 students happened to complain. Ask HSK 1 and HSK 2 students
directly, about specific questions, before optimizing for a level-specific cause.

**Why it gates the plan:** the lexicon-coverage hypothesis rests entirely on the level
split. If HSK 1 and 2 students also hear the problem and simply never reported it, that
theory weakens considerably and the compact-voice explanation may be wrong. Every
remaining conclusion about *why* this happens depends on this one answer.

**What does not change either way:** the architectural fix. Pre-generating audio is the
right move regardless of which hypothesis holds, because it makes output identical across
devices, reproducible by the developer, verifiable after a change, and higher quality than
any compact on-device voice. Only the *diagnosis* depends on Step 0 — not the *remedy*.
Phase 0 below is likewise safe to ship immediately, since those are outright bugs.

## Confirmed defects (independent of root cause)

These are real bugs in the current playback path and are worth fixing regardless:

1. **`rate = 0.3`** (`mandarin-typing-game.tsx`). Default is `1.0`. Basic voices do not
   re-synthesize at low rates — they time-stretch existing samples, producing smeared
   vowels and a metallic warble.
2. **`cancel()` immediately followed by `speak()`**. Both WebKit and Chrome are known to
   silently drop an utterance queued right after a cancel. This is the likely cause of the
   intermittently dead button.
3. **Autoplay fires without a user gesture.** iOS gates the first utterance on a gesture;
   a blocked or deferred utterance can leave the engine wedged or overlap the next one.
4. **Punctuation is sent to the TTS engine.** `stripAnswerStopwords()` cleans the string
   for the typing slots, but `playPronunciation()` receives the raw `answer`.
5. **Voice preference list is not ranked.** `pickFluentMandarinVoice()` iterates over the
   *device's* voice list and returns the first entry matching *any* preference token, so
   `"enhanced"` / `"premium"` earlier in the array confer no priority.
6. **Voice-list retry only triggers on a completely empty list.** If `getVoices()` returns
   a non-empty list that does not yet include Chinese, the code speaks immediately with no
   voice assigned and never registers the `voiceschanged` listener.

## Decision: stop relying on device TTS

The root problem is architectural. As long as audio is synthesized on each student's phone,
the developer cannot hear what students hear, cannot reproduce the bug, and cannot verify a
fix. Every diagnostic round ends in an unfalsifiable guess about someone else's TTS engine.

**Solution: pre-generate audio once per question with Google Cloud TTS, store the files in
Supabase Storage, and play them back as ordinary audio files.** Every student then hears
identical bytes, and the developer can listen to exactly what they receive.

No human recordings are involved — synthesis still happens by machine, just server-side and
ahead of time.

## Google Cloud TTS research

### Mandarin voices available (`cmn-CN`)

| Tier | Voices | Free per month | Price after | SSML |
| --- | --- | --- | --- | --- |
| Standard | `Standard-A`–`D` | 4M characters | $4 / 1M | Yes |
| WaveNet | `Wavenet-A`–`D` | 4M characters | $4 / 1M | Yes |
| Chirp 3: HD | 30 voices (`Chirp3-HD-*`) | 1M characters | $30 / 1M | No |

There is **no Neural2 voice for Mandarin.**

**Chosen voice: `cmn-CN-Wavenet-A`** — supports SSML (needed for properly re-synthesized
slow playback via `<prosody rate="70%">`, as opposed to stretching audio), sits in the
cheaper tier, and reads in a neutral textbook register rather than Chirp 3's conversational
style.

### Cost

Billing is per character **sent for synthesis**, counted monthly. Because audio is
pre-generated, each question is paid for once; student playback costs nothing. The full
corpus is on the order of tens of thousands of characters (HSK 3 alone is ~185 rows at
roughly 15 characters each), which fits inside the smallest free tier many times over.
The free allowance resets monthly, so regeneration after edits is also free.

Note: for Standard and WaveNet, a Chinese character counts as **one** billed character even
though it is 3 bytes in UTF-8.

### Limits

- **5,000 bytes per request** (~1,600 Chinese characters). A one-sentence answer uses well
  under 1% of this.
- **1,000 requests/minute per project** (Chirp 3: 200/min, Studio: 500/min). One request per
  question, so a batch backfill needs pacing — roughly 150 ms between calls keeps a
  comfortable margin, putting a few thousand questions at about 5 minutes.
- Billing must be enabled on the project even to use the free tier.

### Authentication

Cloud TTS does **not** accept a plain API key — `text:synthesize` requires the
`cloud-platform` OAuth scope. Plain `gcloud auth application-default login` user credentials
are also rejected by `texttospeech.googleapis.com`, which trips up many generic tutorials.

Use a **service account key (JSON)** with the official `@google-cloud/text-to-speech` client,
which handles token minting.

### Google Cloud setup steps

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
   (e.g. `fun-mandarin-tts`).
2. Link a billing account (card required; free tier still applies).
3. Set a budget alert of $1–2 in Billing → Budgets & alerts as a safety net.
4. Enable the **Cloud Text-to-Speech API** (otherwise calls fail with `SERVICE_DISABLED`).
5. Create a service account (IAM & Admin → Service Accounts), e.g. `tts-generator`.
   No TTS-specific IAM role is required. If a 403 mentioning service usage appears, grant
   Service Usage Consumer (`roles/serviceusage.serviceUsageConsumer`).
6. Create a JSON key (Keys → Add key → Create new key → JSON). It downloads once and
   cannot be re-downloaded.
7. Base64-encode it into a single-line env var (e.g. `GOOGLE_TTS_CREDENTIALS_B64`), kept in
   `.env.local` locally and in host environment settings for production. Server-side only —
   never expose it to the browser, same handling as the Supabase service-role key.

## Implementation plan

### Phase 0 — Fix the existing playback bugs

Independent and shippable on its own, and not blocked by Step 0 — these are outright bugs.
Also matters because `speechSynthesis` remains the fallback for any question without a
generated file. Addresses defects 1–6 above: raise the rate, strip stopwords before
speaking, replace the `cancel()`-then-`speak()` pattern, gate the first utterance on a user
gesture, rank the voice preference list, and retry voice lookup when the list lacks Chinese
rather than only when it is empty.

**Concrete rate values** (pending confirmation — see Open decisions):

- **`utterance.rate` → `0.9`** on the `speechSynthesis` fallback path. Deliberately not
  `1.0`: a slight reduction preserves the original "keep tones clear for learners" intent,
  while staying close enough to natural that basic voices do not fall back to
  time-stretching. The distortion threshold is somewhere below ~0.8; `0.3` is far past it.
- **Generated audio plays at `1.0`**, with slow replay offered as an explicit control at
  `audio.playbackRate = 0.7` rather than being forced on every playback.

The principle: slow playback should be something a learner *chooses*, not a permanent
degradation applied to everyone.

### Phase 1 — Storage and schema

- New `supabase/` migration: add `audio_path` to `assignment_questions`; create a
  `question-audio` Storage bucket with **public read** and admin-only write.
- New `lib/lms/question-audio.ts`: bucket constant, path helper, and text normalization for
  TTS — mirroring the conventions in `lib/lms/chapter-materials.ts`
  (`CHAPTER_MATERIALS_BUCKET`, `chapterMaterialStoragePath()`).

**Storage is content-addressed**: the filename is a hash of *text + voice + rate*, not the
question UUID. CSV import deletes and re-inserts rows, so UUID-keyed files would be orphaned
on every re-upload and every question would need regenerating. Hashing means unchanged text
reuses existing files for free, edited text automatically gets a new file, and duplicate
answers across chapters share one file.

**Orphaned files are accepted, not collected — a deliberate choice, not an oversight.**
Because filenames are content hashes, editing a question's text produces a new file and
leaves the previous one in the bucket indefinitely. An MP3 of a single sentence is a few KB,
so even thousands of edits cost effectively nothing, and skipping deletion keeps generation
idempotent and safe to re-run. If the bucket ever needs tidying, a cleanup job can delete
objects not referenced by any `assignment_questions.audio_path` — worth revisiting only if
storage growth becomes visible, which is unlikely at this corpus size.

### Phase 2 — Generation

- `lib/tts/google-tts.ts`: thin wrapper that synthesizes one string to MP3 bytes using
  `cmn-CN-Wavenet-A`, reading credentials from the base64 env var.
- `app/api/admin/questions/generate-audio/route.ts`: admin-only, processes a **bounded batch
  per call** (~25 rows) and returns the remaining count; the admin UI loops until done.
  Bounded batches are required because existing routes cap at `maxDuration = 60`
  (see `app/api/admin/chapter-materials/upload/route.ts`), and thousands of sequential API
  calls will not finish inside a serverless timeout. This also provides request pacing and
  per-row resumability.

### Phase 3 — Playback

- Add `audio_path` to the two places that select question columns:
  `getQuestionsForAssignment()` in `lib/lms/assignment-questions.ts` and the inline select in
  `app/student/assignment/[id]/page.tsx`.
- Thread it through `AssignmentQuestionRow`, `MandarinTypingQuestion`
  (`lib/mandarin-typing-questions.ts`), and `toMandarinTypingQuestions()`.
- In `MandarinTypingGame`, play an `<audio>` element when a URL exists; fall back to
  `speechSynthesis` when it does not. Slow replay becomes `audio.playbackRate`, which
  browsers pitch-correct properly.
- Note: browsers block autoplaying audio without a user gesture, same as speech synthesis,
  so the first question still needs a tap. Audio elements are far more predictable about
  this than `speechSynthesis`.

### Phase 4 — Staying in sync

- Show missing-audio counts per level in `components/admin/admin-questions-content.tsx` so
  coverage is visible.
- Trigger generation after CSV import so new questions do not silently ship without audio.

### Phase 5 — Verify the original complaint

Once HSK 3 files exist, listen to the exact bytes students receive. The point of the whole
exercise: the bug becomes reproducible.

## Open decisions

- **Where the backfill runs.** A local one-off script is simpler with no timeout limits but
  only works from the developer's machine. Current inclination: build the batched admin route
  as the real mechanism and skip the throwaway script, since regeneration will be needed after
  every CSV import anyway.
- **Whether to keep the `speechSynthesis` fallback long-term.** Keeping it means no question
  is ever silent, but the inconsistent-audio problem persists for un-generated rows. The
  alternative is hiding the hint button when no file exists.
- **CSV re-import behaviour.** Automatic generation on import (slower uploads) vs. manual
  ("42 questions missing audio" + a generate button).
- **Slow-playback approach.** Client-side `audio.playbackRate` (one file per question) vs. a
  second SSML-generated slow file (better quality, double the characters — still free).

## Verification still worth doing

Confirm how the HSK 3 boundary was established — whether HSK 1 and 2 students were asked
directly, or whether only HSK 3 students happened to report. The reports are secondhand and
not reproducible locally, so the level split is worth validating before optimizing for a
level-specific cause.
