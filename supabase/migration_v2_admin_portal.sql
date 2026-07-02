-- LMS v2 admin portal: RLS policies for admin management actions
-- Run after migration_v2_lms.sql and fix_profiles_rls_recursion.sql

-- Students: admin read / update / delete
drop policy if exists "students_select_admin" on public.students;
create policy "students_select_admin"
on public.students for select to authenticated
using (public.is_admin());

drop policy if exists "students_update_admin" on public.students;
create policy "students_update_admin"
on public.students for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "students_delete_admin" on public.students;
create policy "students_delete_admin"
on public.students for delete to authenticated
using (public.is_admin());

-- Teachers: admin read all
drop policy if exists "teachers_select_admin" on public.teachers;
create policy "teachers_select_admin"
on public.teachers for select to authenticated
using (public.is_admin());

-- Classrooms: admin insert on behalf of teachers
drop policy if exists "classrooms_insert_admin" on public.classrooms;
create policy "classrooms_insert_admin"
on public.classrooms for insert to authenticated
with check (public.is_admin());

-- Promotion flags: admin + teacher access
drop policy if exists "promotion_flags_select_admin_or_teacher" on public.promotion_flags;
create policy "promotion_flags_select_admin_or_teacher"
on public.promotion_flags for select to authenticated
using (
  public.is_admin()
  or flagged_by = auth.uid()
  or exists (
    select 1 from public.students s
    where s.user_id = promotion_flags.student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "promotion_flags_insert_teacher" on public.promotion_flags;
create policy "promotion_flags_insert_teacher"
on public.promotion_flags for insert to authenticated
with check (
  flagged_by = auth.uid()
  and public.is_active_teacher()
  and exists (
    select 1 from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "promotion_flags_update_admin" on public.promotion_flags;
create policy "promotion_flags_update_admin"
on public.promotion_flags for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Profiles: admin may update teacher/student records (status, etc.)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Schema additions (chapter description, in-progress tracking, flag dedupe)
-- ---------------------------------------------------------------------------

-- Chapter description shown on the student chapter detail page
alter table public.hsk_chapters
  add column if not exists description text;

-- Track when a student first opens an assignment (for "in progress" status)
alter table public.student_assignments
  add column if not exists started_at timestamptz;

-- Business rule: only one pending promotion flag per student at a time
create unique index if not exists promotion_flags_one_pending_per_student
  on public.promotion_flags (student_id)
  where status = 'pending';

-- Students mark their own assignment as started (in progress)
-- (covered by existing student_assignments_update_student policy in migration_v2_lms.sql)
