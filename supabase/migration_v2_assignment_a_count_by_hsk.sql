-- Sync assignment slots to the per-HSK Assignment A count map.
-- Safe to re-run after changing counts (deletes extra keys, inserts missing ones).
--
-- Also relaxes key/order constraints to A1–A10 + B (same as migration_v2_assignment_a10.sql).
--
-- Keep a_counts in sync with lib/lms/assignment-keys.ts ASSIGNMENT_A_COUNT_BY_HSK.
-- Each HSK level can be 1–10 independently. After editing the TS map, copy the same
-- numbers into a_counts below and re-run this file.
--
-- order_index stays A1=1 … A10=10, B=11 even when some A keys are absent.

-- ---------------------------------------------------------------------------
-- Allow A1–A10 + B (idempotent)
-- ---------------------------------------------------------------------------

alter table public.assignments
  drop constraint if exists assignments_order_index_check;

alter table public.assignments
  drop constraint if exists assignments_assignment_key_check;

alter table public.student_assignment_progress
  drop constraint if exists student_assignment_progress_assignment_key_check;

alter table public.assignments
  add constraint assignments_order_index_check
  check (order_index between 1 and 11);

alter table public.assignments
  add constraint assignments_assignment_key_check
  check (assignment_key in (
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B'
  ));

alter table public.student_assignment_progress
  add constraint student_assignment_progress_assignment_key_check
  check (assignment_key in (
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B'
  ));

-- ---------------------------------------------------------------------------
-- Ensure B is at order 11 so A2–A10 can occupy 2–10
-- ---------------------------------------------------------------------------

update public.assignments
set order_index = 11
where assignment_key = 'B'
  and order_index <> 11;

-- ---------------------------------------------------------------------------
-- One VALUES list drives both delete and insert (any mix of 1–10 A's per HSK)
-- ---------------------------------------------------------------------------

with a_counts(hsk_level, a_count) as (
  values
    (1, 10),
    (2, 4),
    (3, 4),
    (4, 4),
    (5, 4),
    (6, 4),
    (7, 4),
    (8, 4),
    (9, 4)
),
allowed as (
  select
    c.id as chapter_id,
    keys.assignment_key,
    keys.order_index
  from public.hsk_chapters c
  join a_counts ac on ac.hsk_level = c.hsk_level
  cross join lateral (
    select format('A%s', g.n)::text as assignment_key, g.n as order_index
    from generate_series(1, ac.a_count) as g(n)
    union all
    select 'B', 11
  ) keys
),
deleted as (
  delete from public.assignments a
  where not exists (
    select 1
    from allowed al
    where al.chapter_id = a.chapter_id
      and al.assignment_key = a.assignment_key
  )
  returning a.id
)
insert into public.assignments (chapter_id, title, order_index, assignment_key)
select
  al.chapter_id,
  format('Assignment %s', al.assignment_key),
  al.order_index,
  al.assignment_key
from allowed al
where (select count(*) from deleted) >= 0
on conflict (chapter_id, assignment_key) do update
set
  title = excluded.title,
  order_index = excluded.order_index;

-- Cascades student_assignments and assignment_questions for removed keys.

-- ---------------------------------------------------------------------------
-- Seed locked rows for any newly inserted assignments at the student's HSK
-- ---------------------------------------------------------------------------

insert into public.student_assignments (student_id, assignment_id, is_locked)
select s.user_id, a.id, true
from public.students s
join public.hsk_chapters c on c.hsk_level = s.current_hsk_level
join public.assignments a on a.chapter_id = c.id
on conflict (student_id, assignment_id) do nothing;
