-- Demo-only policy for Kanban status persistence on public.assignments.
-- Apply this only if RLS is enabled on public.assignments.
-- Replace with authenticated, role-based policies when auth is implemented.

alter table public.assignments enable row level security;

drop policy if exists "demo_update_assignment_status" on public.assignments;
create policy "demo_update_assignment_status"
  on public.assignments
  for update
  using (true)
  with check (true);
