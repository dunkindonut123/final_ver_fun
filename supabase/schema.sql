-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role' and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('student', 'teacher', 'admin');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  teacher_code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  teacher_id uuid references public.teachers(user_id) on delete set null,
  current_hsk_level int not null default 1,
  current_bab int not null default 1,
  current_pertemuan int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hsk_chapters (
  id text primary key,
  title text not null,
  hsk_level int not null check (hsk_level between 1 and 9),
  chapter_number int not null check (chapter_number between 1 and 10),
  created_at timestamptz not null default now(),
  unique (hsk_level, chapter_number)
);

create table if not exists public.student_chapter_access (
  student_id uuid not null references public.students(user_id) on delete cascade,
  chapter_id text not null references public.hsk_chapters(id) on delete cascade,
  is_unlocked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_id, chapter_id)
);

create table if not exists public.student_chapter_progress (
  student_id uuid not null references public.students(user_id) on delete cascade,
  chapter_id text not null references public.hsk_chapters(id) on delete cascade,
  score int check (score between 0 and 100),
  is_completed boolean not null default false,
  time_spent_minutes int not null default 0,
  last_accessed timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, chapter_id)
);

create table if not exists public.student_assignment_progress (
  student_id uuid not null references public.students(user_id) on delete cascade,
  chapter_id text not null references public.hsk_chapters(id) on delete cascade,
  assignment_key text not null check (assignment_key in ('A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, chapter_id, assignment_key)
);

insert into public.hsk_chapters (id, title, hsk_level, chapter_number)
select
  format('hsk%s-ch%s', level_num, chapter_num),
  format('Chapter %s', chapter_num),
  level_num,
  chapter_num
from generate_series(1, 9) as level_num
cross join generate_series(1, 10) as chapter_num
on conflict do nothing;

create index if not exists teacher_requests_status_created_at_idx
on public.teacher_requests (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_requests_set_updated_at on public.teacher_requests;
create trigger teacher_requests_set_updated_at
before update on public.teacher_requests
for each row
execute function public.set_updated_at();

drop trigger if exists student_chapter_access_set_updated_at on public.student_chapter_access;
create trigger student_chapter_access_set_updated_at
before update on public.student_chapter_access
for each row
execute function public.set_updated_at();

drop trigger if exists student_chapter_progress_set_updated_at on public.student_chapter_progress;
create trigger student_chapter_progress_set_updated_at
before update on public.student_chapter_progress
for each row
execute function public.set_updated_at();

drop trigger if exists student_assignment_progress_set_updated_at on public.student_assignment_progress;
create trigger student_assignment_progress_set_updated_at
before update on public.student_assignment_progress
for each row
execute function public.set_updated_at();

create or replace function public.find_teacher_by_code(input_code text)
returns table(user_id uuid)
language sql
security definer
set search_path = public
as $$
  select t.user_id
  from public.teachers t
  where t.teacher_code = upper(trim(input_code))
  limit 1;
$$;

revoke all on function public.find_teacher_by_code(text) from public;
grant execute on function public.find_teacher_by_code(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.teacher_requests enable row level security;
alter table public.hsk_chapters enable row level security;
alter table public.student_chapter_access enable row level security;
alter table public.student_chapter_progress enable row level security;
alter table public.student_assignment_progress enable row level security;

drop policy if exists "hsk_chapters_select_all" on public.hsk_chapters;
create policy "hsk_chapters_select_all"
on public.hsk_chapters for select
to anon, authenticated
using (true);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.students s
    where s.user_id = id and s.teacher_id = auth.uid()
  )
  or exists (
    select 1
    from public.students s
    where s.user_id = auth.uid() and s.teacher_id = id
  )
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "teachers_select_own" on public.teachers;
create policy "teachers_select_own"
on public.teachers for select
using (auth.uid() = user_id);

drop policy if exists "teachers_insert_own" on public.teachers;
create policy "teachers_insert_own"
on public.teachers for insert
with check (auth.uid() = user_id);

drop policy if exists "teachers_update_own" on public.teachers;
create policy "teachers_update_own"
on public.teachers for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "students_select_own" on public.students;
create policy "students_select_own"
on public.students for select
using (
  auth.uid() = user_id
  or teacher_id = auth.uid()
);

drop policy if exists "students_insert_own" on public.students;
create policy "students_insert_own"
on public.students for insert
with check (auth.uid() = user_id);

drop policy if exists "students_update_own" on public.students;
create policy "students_update_own"
on public.students for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "teacher_requests_insert_any" on public.teacher_requests;
create policy "teacher_requests_insert_any"
on public.teacher_requests for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "student_chapter_access_select_student_or_teacher" on public.student_chapter_access;
create policy "student_chapter_access_select_student_or_teacher"
on public.student_chapter_access for select
to authenticated
using (
  auth.uid() = student_id
  or exists (
    select 1
    from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "student_chapter_access_upsert_teacher" on public.student_chapter_access;
create policy "student_chapter_access_upsert_teacher"
on public.student_chapter_access for insert
to authenticated
with check (
  exists (
    select 1
    from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "student_chapter_access_update_teacher" on public.student_chapter_access;
create policy "student_chapter_access_update_teacher"
on public.student_chapter_access for update
to authenticated
using (
  exists (
    select 1
    from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "student_chapter_progress_select_student_or_teacher" on public.student_chapter_progress;
create policy "student_chapter_progress_select_student_or_teacher"
on public.student_chapter_progress for select
to authenticated
using (
  auth.uid() = student_id
  or exists (
    select 1
    from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "student_chapter_progress_insert_student" on public.student_chapter_progress;
create policy "student_chapter_progress_insert_student"
on public.student_chapter_progress for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "student_chapter_progress_update_student" on public.student_chapter_progress;
create policy "student_chapter_progress_update_student"
on public.student_chapter_progress for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

drop policy if exists "student_assignment_progress_select_student_or_teacher" on public.student_assignment_progress;
create policy "student_assignment_progress_select_student_or_teacher"
on public.student_assignment_progress for select
to authenticated
using (
  auth.uid() = student_id
  or exists (
    select 1
    from public.students s
    where s.user_id = student_id and s.teacher_id = auth.uid()
  )
);

drop policy if exists "student_assignment_progress_insert_student" on public.student_assignment_progress;
create policy "student_assignment_progress_insert_student"
on public.student_assignment_progress for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "student_assignment_progress_update_student" on public.student_assignment_progress;
create policy "student_assignment_progress_update_student"
on public.student_assignment_progress for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);
