-- Sync hsk_chapters to the per-HSK chapter count map.
-- Safe to re-run after changing counts (deletes extra chapters, inserts missing ones).
--
-- Keep chapter_counts in sync with lib/lms/hsk-chapters.ts CHAPTER_COUNT_BY_HSK.
-- Each HSK level can be 1–15 independently. After editing the TS map, copy the same
-- numbers into chapter_counts below and re-run this file.
--
-- Then re-run migration_v2_assignment_a_count_by_hsk.sql so new chapters get A1…An + B
-- and students at that HSK get locked student_assignments.
--
-- Reducing a count DELETES extra hsk_chapters rows. Cascades assignments, questions,
-- student_assignments, attempts, chapter_materials, and chapter access/progress.

-- ---------------------------------------------------------------------------
-- Allow chapter_number 1–15 (idempotent)
-- ---------------------------------------------------------------------------

alter table public.hsk_chapters
  drop constraint if exists hsk_chapters_chapter_number_check;

alter table public.hsk_chapters
  add constraint hsk_chapters_chapter_number_check
  check (chapter_number between 1 and 15);

-- ---------------------------------------------------------------------------
-- One VALUES list drives both delete and insert (any mix of 1–15 chapters per HSK)
-- ---------------------------------------------------------------------------

with chapter_counts(hsk_level, chapter_count) as (
  values
    (1, 15),
    (2, 15),
    (3, 15),
    (4, 15),
    (5, 15),
    (6, 15),
    (7, 15),
    (8, 15),
    (9, 15)
),
allowed as (
  select
    format('hsk%s-ch%s', cc.hsk_level, g.n) as id,
    format('Chapter %s', g.n) as title,
    cc.hsk_level,
    g.n as chapter_number
  from chapter_counts cc
  cross join lateral generate_series(1, cc.chapter_count) as g(n)
),
deleted as (
  delete from public.hsk_chapters c
  where not exists (
    select 1
    from allowed al
    where al.id = c.id
  )
  returning c.id
)
insert into public.hsk_chapters (id, title, hsk_level, chapter_number)
select
  al.id,
  al.title,
  al.hsk_level,
  al.chapter_number
from allowed al
where (select count(*) from deleted) >= 0
on conflict (id) do nothing;
