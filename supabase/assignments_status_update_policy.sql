-- Legacy hardening for the early demo status update model.
--
-- Current Kanban persistence updates public.assignment_students.status, not
-- public.assignments. Remove the previous demo-wide assignments update policy.

alter table public.assignments enable row level security;

drop policy if exists "demo_update_assignment_status" on public.assignments;

