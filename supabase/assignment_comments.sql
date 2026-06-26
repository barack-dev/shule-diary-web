-- Deprecated assignment_comments table for the early demo comment model.
--
-- The app now writes to public.comments with assignment_student_id and user_id.
-- This legacy table intentionally has RLS enabled and no permissive policies
-- because it does not contain enough ownership data to isolate rows safely.

create table if not exists public.assignment_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id text not null,
  author_name text not null,
  author_role text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.assignment_comments enable row level security;

drop policy if exists "demo_select_assignment_comments" on public.assignment_comments;
drop policy if exists "demo_insert_assignment_comments" on public.assignment_comments;

create index if not exists assignment_comments_assignment_id_created_at_idx
  on public.assignment_comments (assignment_id, created_at);

