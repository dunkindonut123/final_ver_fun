-- STEP 1 of LMS v2 migration
-- Run this file ALONE in Supabase SQL Editor, wait for success, then run migration_v2_lms.sql
--
-- PostgreSQL cannot use a newly added enum value in the same transaction.
-- Supabase SQL Editor wraps each run in a transaction, so enum changes must be committed first.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_status' and n.nspname = 'public'
  ) then
    create type public.user_status as enum ('pending', 'active', 'rejected');
  end if;
end
$$;

alter type public.user_role add value if not exists 'admin';
