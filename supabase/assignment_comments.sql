-- Assignment comments table for dashboard comment loading and demo inserts.

create table if not exists public.assignment_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id text not null,
  author_name text not null,
  author_role text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.assignment_comments enable row level security;

-- DEMO-ONLY POLICIES:
-- These permissive policies are temporary and must be replaced with
-- authenticated, role-based policies when authentication is added.
drop policy if exists "demo_select_assignment_comments" on public.assignment_comments;
create policy "demo_select_assignment_comments"
  on public.assignment_comments
  for select
  using (true);

drop policy if exists "demo_insert_assignment_comments" on public.assignment_comments;
create policy "demo_insert_assignment_comments"
  on public.assignment_comments
  for insert
  with check (true);

create index if not exists assignment_comments_assignment_id_created_at_idx
  on public.assignment_comments (assignment_id, created_at);
