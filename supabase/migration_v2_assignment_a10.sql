-- Allow Assignment A1–A10 + B.
-- Run after migration_v2_assignment_a4.sql (and before or with
-- migration_v2_assignment_a_count_by_hsk.sql).
--
-- order_index: A1=1 … A10=10, B=11 so missing A keys do not require moving B.

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

update public.assignments
set order_index = 11
where assignment_key = 'B'
  and order_index <> 11;
