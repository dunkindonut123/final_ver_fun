-- Pre-generated pronunciation audio for Assignment A questions
-- Run after migration_v2_assignment_questions.sql

-- ---------------------------------------------------------------------------
-- Storage path of the generated MP3 (null = not generated yet)
-- ---------------------------------------------------------------------------

alter table public.assignment_questions
  add column if not exists audio_path text;

-- Backfill batches repeatedly ask for rows without audio.
create index if not exists assignment_questions_missing_audio_idx
  on public.assignment_questions (assignment_id)
  where audio_path is null;

-- ---------------------------------------------------------------------------
-- Supabase Storage bucket (public read — students play plain <audio> URLs)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-audio',
  'question-audio',
  true,
  5242880,
  array['audio/mpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Writes go through the service role in admin API routes.
