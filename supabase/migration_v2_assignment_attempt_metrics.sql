-- Correct/total metrics for assignment A (A1–A3) completions and attempt history
-- Run after migration_v2_assignment_attempts.sql

alter table public.student_assignments
  add column if not exists correct_count int check (correct_count is null or correct_count >= 0),
  add column if not exists total_questions int check (total_questions is null or total_questions > 0);

alter table public.student_assignment_attempts
  add column if not exists correct_count int check (correct_count is null or correct_count >= 0),
  add column if not exists total_questions int check (total_questions is null or total_questions > 0);
