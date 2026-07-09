-- Chapter materials: one PDF per chapter (admin-managed, global curriculum)
-- Run after migration_v2_admin_portal.sql

-- ---------------------------------------------------------------------------
-- Metadata (storage path + display file name)
-- ---------------------------------------------------------------------------

create table if not exists public.chapter_materials (
  chapter_id text primary key references public.hsk_chapters(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

drop trigger if exists chapter_materials_set_updated_at on public.chapter_materials;
create trigger chapter_materials_set_updated_at
before update on public.chapter_materials
for each row
execute function public.set_updated_at();

alter table public.chapter_materials enable row level security;

drop policy if exists "chapter_materials_select_authenticated" on public.chapter_materials;
create policy "chapter_materials_select_authenticated"
on public.chapter_materials for select to authenticated
using (true);

-- Writes go through the service role in admin API routes.

-- ---------------------------------------------------------------------------
-- Supabase Storage bucket (private — served via authenticated API routes)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chapter-materials',
  'chapter-materials',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
