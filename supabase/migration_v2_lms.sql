-- LMS v2 migration (STEP 2): classrooms, per-assignment lock/unlock, admin RLS
--
-- PREREQUISITE: Run migration_v2_lms_step1_enums.sql first and wait for it to succeed.
-- (PostgreSQL requires new enum values to be committed before they can be used in policies.)

-- ---------------------------------------------------------------------------
-- Profiles: account status
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists status public.user_status not null default 'active';

-- ---------------------------------------------------------------------------
-- Teachers: teacher_code is legacy (optional)
-- ---------------------------------------------------------------------------

alter table public.teachers
  alter column teacher_code drop not null;

-- ---------------------------------------------------------------------------
-- Classrooms
-- ---------------------------------------------------------------------------

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_code text unique not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  hsk_level int not null check (hsk_level between 1 and 9),
  created_at timestamptz not null default now()
);

create index if not exists classrooms_teacher_id_idx on public.classrooms (teacher_id);
create index if not exists classrooms_class_code_idx on public.classrooms (upper(class_code));

alter table public.students
  add column if not exists classroom_id uuid references public.classrooms(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Assignments (4 per chapter, metadata only — games use static content)
-- ---------------------------------------------------------------------------

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null references public.hsk_chapters(id) on delete cascade,
  title text not null,
  order_index int not null check (order_index between 1 and 4),
  assignment_key text not null check (assignment_key in ('A1', 'A2', 'A3', 'B')),
  created_at timestamptz not null default now(),
  unique (chapter_id, order_index),
  unique (chapter_id, assignment_key)
);

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
on conflict (chapter_id, assignment_key) do nothing;

-- ---------------------------------------------------------------------------
-- Student assignments (teacher lock/unlock + completion)
-- ---------------------------------------------------------------------------

create table if not exists public.student_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  is_locked boolean not null default true,
  is_completed boolean not null default false,
  score int check (score between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, assignment_id)
);

create index if not exists student_assignments_student_id_idx
  on public.student_assignments (student_id);

drop trigger if exists student_assignments_set_updated_at on public.student_assignments;
create trigger student_assignments_set_updated_at
before update on public.student_assignments
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Promotion flags (schema only — UI deferred)
-- ---------------------------------------------------------------------------

create table if not exists public.promotion_flags (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  flagged_by uuid not null references public.profiles(id) on delete cascade,
  current_level int not null,
  target_level int not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RPC: classroom lookup for student signup
-- ---------------------------------------------------------------------------

create or replace function public.find_classroom_by_code(input_code text)
returns table(
  id uuid,
  teacher_id uuid,
  hsk_level int,
  name text
)
language sql
security definer
set search_path = public
as $$
  select c.id, c.teacher_id, c.hsk_level, c.name
  from public.classrooms c
  where upper(trim(c.class_code)) = upper(trim(input_code))
  limit 1;
$$;

revoke all on function public.find_classroom_by_code(text) from public;
grant execute on function public.find_classroom_by_code(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed student_assignments for a student's HSK level
-- ---------------------------------------------------------------------------

create or replace function public.seed_student_assignments(p_student_id uuid, p_hsk_level int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_assignments (student_id, assignment_id, is_locked)
  select p_student_id, a.id, true
  from public.assignments a
  join public.hsk_chapters c on c.id = a.chapter_id
  where c.hsk_level = p_hsk_level
  on conflict (student_id, assignment_id) do nothing;
end;
$$;

revoke all on function public.seed_student_assignments(uuid, int) from public;
grant execute on function public.seed_student_assignments(uuid, int) to authenticated;

-- Role checks for RLS (security definer avoids profiles self-recursion)
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.classrooms enable row level security;
alter table public.assignments enable row level security;
alter table public.student_assignments enable row level security;
alter table public.promotion_flags enable row level security;

-- Classrooms: teachers see own; students see own classroom; admins via service role
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

drop policy if exists "classrooms_update_teacher" on public.classrooms;
create policy "classrooms_update_teacher"
on public.classrooms for update to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

-- Assignments: readable by all authenticated users
drop policy if exists "assignments_select_authenticated" on public.assignments;
create policy "assignments_select_authenticated"
on public.assignments for select to authenticated
using (true);

-- Student assignments
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

drop policy if exists "student_assignments_insert_student" on public.student_assignments;
create policy "student_assignments_insert_student"
on public.student_assignments for insert to authenticated
with check (student_id = auth.uid());

drop policy if exists "student_assignments_update_student" on public.student_assignments;
create policy "student_assignments_update_student"
on public.student_assignments for update to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "student_assignments_update_teacher" on public.student_assignments;
create policy "student_assignments_update_teacher"
on public.student_assignments for update to authenticated
using (
  exists (
    select 1 from public.students s
    where s.user_id = student_assignments.student_id and s.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.students s
    where s.user_id = student_assignments.student_id and s.teacher_id = auth.uid()
  )
);

-- Profiles: allow admin to read all profiles
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles for select to authenticated
using (public.is_admin());

-- Students: allow teacher update for their students (classroom assignment)
drop policy if exists "students_update_teacher" on public.students;
create policy "students_update_teacher"
on public.students for update to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Admin portal RLS (also in migration_v2_admin_portal.sql)
-- ---------------------------------------------------------------------------

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

drop policy if exists "teachers_select_admin" on public.teachers;
create policy "teachers_select_admin"
on public.teachers for select to authenticated
using (public.is_admin());

drop policy if exists "classrooms_insert_admin" on public.classrooms;
create policy "classrooms_insert_admin"
on public.classrooms for insert to authenticated
with check (public.is_admin());

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

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed admin account (run manually after creating auth user):
--
-- 1. Create user in Supabase Auth dashboard with email/password
-- 2. Insert profile:
--    insert into public.profiles (id, email, full_name, role, status)
--    values ('<auth-user-uuid>', 'admin@funmandarin.com', 'Admin', 'admin', 'active');
-- ---------------------------------------------------------------------------
