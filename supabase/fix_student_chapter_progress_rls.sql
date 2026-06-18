-- Run this in Supabase SQL Editor on your current project.

alter table public.student_chapter_progress enable row level security;

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
