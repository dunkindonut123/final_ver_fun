-- Assignment question content (CSV-importable)
-- Run after migration_v2_admin_portal.sql

-- ---------------------------------------------------------------------------
-- assignment_questions
-- ---------------------------------------------------------------------------

create table if not exists public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  question_order int not null check (question_order > 0),
  answer text not null,
  pinyin_hint text,
  meaning_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, question_order)
);

create index if not exists assignment_questions_assignment_id_idx
  on public.assignment_questions (assignment_id);

drop trigger if exists assignment_questions_set_updated_at on public.assignment_questions;
create trigger assignment_questions_set_updated_at
before update on public.assignment_questions
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- import_batches (audit trail for CSV uploads)
-- ---------------------------------------------------------------------------

create table if not exists public.question_import_batches (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  row_count int not null default 0,
  assignment_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.assignment_questions enable row level security;
alter table public.question_import_batches enable row level security;

-- Students (and teachers/admins) may read questions for gameplay
drop policy if exists "assignment_questions_select_authenticated" on public.assignment_questions;
create policy "assignment_questions_select_authenticated"
on public.assignment_questions for select to authenticated
using (true);

-- Admins may insert/update/delete questions
drop policy if exists "assignment_questions_insert_admin" on public.assignment_questions;
create policy "assignment_questions_insert_admin"
on public.assignment_questions for insert to authenticated
with check (public.is_admin());

drop policy if exists "assignment_questions_update_admin" on public.assignment_questions;
create policy "assignment_questions_update_admin"
on public.assignment_questions for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "assignment_questions_delete_admin" on public.assignment_questions;
create policy "assignment_questions_delete_admin"
on public.assignment_questions for delete to authenticated
using (public.is_admin());

-- Import batch audit: admin read/insert only
drop policy if exists "question_import_batches_select_admin" on public.question_import_batches;
create policy "question_import_batches_select_admin"
on public.question_import_batches for select to authenticated
using (public.is_admin());

drop policy if exists "question_import_batches_insert_admin" on public.question_import_batches;
create policy "question_import_batches_insert_admin"
on public.question_import_batches for insert to authenticated
with check (public.is_admin());
