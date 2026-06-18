-- Fix: "infinite recursion detected in policy for relation profiles"
--
-- RLS policies must not subquery the same table they protect. Use security
-- definer helpers so role checks bypass RLS on profiles.
--
-- Run this in the Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_active_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'teacher' and status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.is_active_teacher() from public;
grant execute on function public.is_active_teacher() to authenticated;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles for select to authenticated
using (public.is_admin());

drop policy if exists "classrooms_select_teacher_own" on public.classrooms;
create policy "classrooms_select_teacher_own"
on public.classrooms for select to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1 from public.students s
    where s.user_id = auth.uid() and s.classroom_id = classrooms.id
  )
  or public.is_admin()
);

drop policy if exists "classrooms_insert_teacher" on public.classrooms;
create policy "classrooms_insert_teacher"
on public.classrooms for insert to authenticated
with check (
  teacher_id = auth.uid()
  and public.is_active_teacher()
);

drop policy if exists "student_assignments_select_student_or_teacher" on public.student_assignments;
create policy "student_assignments_select_student_or_teacher"
on public.student_assignments for select to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1 from public.students s
    where s.user_id = student_assignments.student_id and s.teacher_id = auth.uid()
  )
  or public.is_admin()
);
