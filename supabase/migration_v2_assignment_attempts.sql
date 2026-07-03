-- Student assignment attempt history (for teacher review)
-- Run after migration_v2_admin_portal.sql

create table if not exists public.student_assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  student_assignment_id uuid not null references public.student_assignments(id) on delete cascade,
  score int not null check (score between 0 and 100),
  correct_count int check (correct_count is null or correct_count >= 0),
  total_questions int check (total_questions is null or total_questions > 0),
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists student_assignment_attempts_student_assignment_id_completed_at_idx
  on public.student_assignment_attempts (student_assignment_id, completed_at desc);

alter table public.student_assignment_attempts enable row level security;

drop policy if exists "student_assignment_attempts_select_student_or_teacher" on public.student_assignment_attempts;
create policy "student_assignment_attempts_select_student_or_teacher"
on public.student_assignment_attempts for select to authenticated
using (
  exists (
    select 1
    from public.student_assignments sa
    where sa.id = student_assignment_attempts.student_assignment_id
      and (
        sa.student_id = auth.uid()
        or exists (
          select 1 from public.students s
          where s.user_id = sa.student_id and s.teacher_id = auth.uid()
        )
        or public.is_admin()
      )
  )
);

drop policy if exists "student_assignment_attempts_insert_student" on public.student_assignment_attempts;
create policy "student_assignment_attempts_insert_student"
on public.student_assignment_attempts for insert to authenticated
with check (
  exists (
    select 1
    from public.student_assignments sa
    where sa.id = student_assignment_attempts.student_assignment_id
      and sa.student_id = auth.uid()
  )
);
