-- Add Assignment A4 before B for every chapter.
-- Run after migration_v2_assignment_attempt_metrics.sql (existing databases).
--
-- Sequence becomes A1 → A2 → A3 → A4 → B.
-- Existing A/B question rows and completions are left unchanged.
-- New A4 student_assignments rows are locked and not completed.

-- ---------------------------------------------------------------------------
-- Relax assignment key / order checks
-- ---------------------------------------------------------------------------

alter table public.assignments
  drop constraint if exists assignments_order_index_check;

alter table public.assignments
  drop constraint if exists assignments_assignment_key_check;

alter table public.student_assignment_progress
  drop constraint if exists student_assignment_progress_assignment_key_check;

alter table public.assignments
  add constraint assignments_order_index_check
  check (order_index between 1 and 5);

alter table public.assignments
  add constraint assignments_assignment_key_check
  check (assignment_key in ('A1', 'A2', 'A3', 'A4', 'B'));

alter table public.student_assignment_progress
  add constraint student_assignment_progress_assignment_key_check
  check (assignment_key in ('A1', 'A2', 'A3', 'A4', 'B'));

-- ---------------------------------------------------------------------------
-- Move B to order 5, then insert A4 at order 4
-- ---------------------------------------------------------------------------

update public.assignments
set order_index = 5
where assignment_key = 'B'
  and order_index = 4;

insert into public.assignments (chapter_id, title, order_index, assignment_key)
select
  c.id,
  'Assignment A4',
  4,
  'A4'
from public.hsk_chapters c
on conflict (chapter_id, assignment_key) do nothing;

-- ---------------------------------------------------------------------------
-- Seed locked A4 rows for students who already have assignments in that chapter
-- ---------------------------------------------------------------------------

insert into public.student_assignments (student_id, assignment_id, is_locked)
select distinct sa.student_id, a4.id, true
from public.student_assignments sa
join public.assignments existing on existing.id = sa.assignment_id
join public.assignments a4
  on a4.chapter_id = existing.chapter_id
 and a4.assignment_key = 'A4'
on conflict (student_id, assignment_id) do nothing;

insert into public.student_assignments (student_id, assignment_id, is_locked)
select s.user_id, a.id, true
from public.students s
join public.hsk_chapters c on c.hsk_level = s.current_hsk_level
join public.assignments a on a.chapter_id = c.id and a.assignment_key = 'A4'
on conflict (student_id, assignment_id) do nothing;
