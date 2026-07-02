-- Extend HSK support from 6 to 9 levels
-- Run after migration_v2_assignment_questions.sql (or any prior LMS migration)

-- ---------------------------------------------------------------------------
-- Relax and replace check constraints
-- ---------------------------------------------------------------------------

alter table public.hsk_chapters
  drop constraint if exists hsk_chapters_hsk_level_check;

alter table public.hsk_chapters
  add constraint hsk_chapters_hsk_level_check
  check (hsk_level between 1 and 9);

alter table public.classrooms
  drop constraint if exists classrooms_hsk_level_check;

alter table public.classrooms
  add constraint classrooms_hsk_level_check
  check (hsk_level between 1 and 9);

-- ---------------------------------------------------------------------------
-- Seed chapters 7–9 (10 chapters each)
-- ---------------------------------------------------------------------------

insert into public.hsk_chapters (id, title, hsk_level, chapter_number)
select
  format('hsk%s-ch%s', level_num, chapter_num),
  format('Chapter %s', chapter_num),
  level_num,
  chapter_num
from generate_series(7, 9) as level_num
cross join generate_series(1, 10) as chapter_num
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Seed assignments for new chapters (4 per chapter)
-- ---------------------------------------------------------------------------

insert into public.assignments (chapter_id, title, order_index, assignment_key)
select
  c.id,
  format('Assignment %s', keys.assignment_key),
  keys.order_index,
  keys.assignment_key
from public.hsk_chapters c
cross join (
  values
    (1, 'A1'),
    (2, 'A2'),
    (3, 'A3'),
    (4, 'B')
) as keys(order_index, assignment_key)
where c.hsk_level between 7 and 9
on conflict (chapter_id, assignment_key) do nothing;
