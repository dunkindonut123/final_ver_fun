-- Sync hsk_chapters to the per-HSK chapter count map.
-- Safe to re-run after changing counts (deletes extra chapters, inserts missing ones).
--
-- Keep chapter_counts in sync with lib/lms/hsk-chapters.ts CHAPTER_COUNT_BY_HSK.
-- Each HSK level can be 1–15 independently. After editing the TS map, copy the same
-- numbers into chapter_counts below and re-run this file.
--
-- Then re-run this file after changing chapter counts. It also inserts missing
-- Assignment A slots + B and seeds locked student_assignments. You can still
-- re-run migration_v2_assignment_a_count_by_hsk.sql to fully sync A-slot counts.
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

-- ---------------------------------------------------------------------------
-- Seed A1…An + B for every chapter (insert missing only).
-- Keep a_counts in sync with lib/lms/assignment-keys.ts ASSIGNMENT_A_COUNT_BY_HSK.
-- Then seed locked student_assignments for students at that HSK.
-- ---------------------------------------------------------------------------

insert into public.assignments (chapter_id, title, order_index, assignment_key)
select
  c.id,
  format('Assignment %s', keys.assignment_key),
  keys.order_index,
  keys.assignment_key
from public.hsk_chapters c
join (
  values
    (1, 3),
    (2, 4),
    (3, 4),
    (4, 4),
    (5, 4),
    (6, 4),
    (7, 4),
    (8, 4),
    (9, 4)
) as ac(hsk_level, a_count) on ac.hsk_level = c.hsk_level
cross join lateral (
  select format('A%s', g.n)::text as assignment_key, g.n as order_index
  from generate_series(1, ac.a_count) as g(n)
  union all
  select 'B', 11
) keys
on conflict (chapter_id, assignment_key) do nothing;

insert into public.student_assignments (student_id, assignment_id, is_locked)
select s.user_id, a.id, true
from public.students s
join public.hsk_chapters c on c.hsk_level = s.current_hsk_level
join public.assignments a on a.chapter_id = c.id
on conflict (student_id, assignment_id) do nothing;
