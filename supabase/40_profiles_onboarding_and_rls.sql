-- TEMPORARY DEVELOPMENT / EARLY PRODUCTION HARDENING
--
-- Purpose:
-- 1) Ensure public.profiles supports onboarding fields.
-- 2) Link profile rows to authenticated users via user_id (auth.users.id).
-- 3) Add safe self-only RLS policies for profile read/insert/update.
--
-- Notes:
-- - This migration is idempotent and safe to re-run.
-- - It preserves legacy auth_user_id links for backward compatibility.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  auth_user_id uuid,
  full_name text,
  school_name text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists auth_user_id uuid;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists school_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Keep legacy and new linkage columns synchronized for existing rows.
update public.profiles
set user_id = auth_user_id
where user_id is null
  and auth_user_id is not null;

update public.profiles
set auth_user_id = user_id
where auth_user_id is null
  and user_id is not null;

create unique index if not exists profiles_user_id_unique_idx
  on public.profiles (user_id)
  where user_id is not null;

create unique index if not exists profiles_auth_user_id_unique_idx
  on public.profiles (auth_user_id)
  where auth_user_id is not null;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at_trigger on public.profiles;
create trigger set_profiles_updated_at_trigger
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

-- Replace older demo profile read policy with strict self-only access.
drop policy if exists "temp_demo_authenticated_select_profiles" on public.profiles;
drop policy if exists "user_scoped_select_own_profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  );

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  );

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  )
  with check (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  );

-- Optional verification query.
select
  id,
  user_id,
  auth_user_id,
  full_name,
  school_name,
  role,
  created_at,
  updated_at
from public.profiles
where user_id = auth.uid()
   or auth_user_id = auth.uid();
