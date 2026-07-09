-- Indexes for common RLS predicates and list/dashboard queries.
-- Safe to re-run (IF NOT EXISTS).

-- students: teacher dashboards, classroom membership, RLS EXISTS checks
create index if not exists students_classroom_id_idx
  on public.students (classroom_id);

create index if not exists students_teacher_id_idx
  on public.students (teacher_id);

-- profiles: admin role/status filters and is_admin / is_active_teacher helpers
create index if not exists profiles_role_status_created_at_idx
  on public.profiles (role, status, created_at desc);

-- promotion_flags: admin/teacher promotion queues
create index if not exists promotion_flags_status_created_at_idx
  on public.promotion_flags (status, created_at desc);

create index if not exists promotion_flags_student_id_created_at_idx
  on public.promotion_flags (student_id, created_at desc);

-- classrooms: teacher dashboard ordered by created_at
create index if not exists classrooms_teacher_id_created_at_idx
  on public.classrooms (teacher_id, created_at desc);

-- assignments: chapter + key lookups (e.g. typing-hanzi resolve)
create index if not exists assignments_chapter_id_idx
  on public.assignments (chapter_id);

-- Align class-code index with find_classroom_by_code (upper(trim(class_code)))
drop index if exists public.classrooms_class_code_idx;
create index if not exists classrooms_class_code_idx
  on public.classrooms (upper(trim(class_code)));
