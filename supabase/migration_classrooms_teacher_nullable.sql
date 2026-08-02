-- Allow classrooms (and their students) to outlive a deleted teacher.
-- Admin can reassign teacher_id later.

alter table public.classrooms
  alter column teacher_id drop not null;

alter table public.classrooms
  drop constraint if exists classrooms_teacher_id_fkey;

alter table public.classrooms
  add constraint classrooms_teacher_id_fkey
  foreign key (teacher_id)
  references public.profiles(id)
  on delete set null;
