-- One-time data wipe: remove all imported assignment question content.
-- Safe to run: no other tables reference assignment_questions (it only references assignments).
-- Tables and RLS policies are unchanged; CSV import still works afterward.

delete from public.assignment_questions;

-- Optional audit cleanup (does not affect gameplay or import):
delete from public.question_import_batches;
