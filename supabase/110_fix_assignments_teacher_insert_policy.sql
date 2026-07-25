-- FIX: assignments inserts must be allowed for teacher profiles
--
-- Why this exists:
-- - public.assignments rows do not currently store a student_id, class_id, or
--   teacher_id, so an INSERT policy on this table cannot validate the selected
--   assignment target directly.
-- - The app validates teacher ownership before inserting, and the follow-up
--   public.assignment_students insert policy enforces that the selected
--   students belong to classes owned by the current teacher.
--
-- Safety:
-- - Idempotent (CREATE OR REPLACE FUNCTION + DROP/CREATE POLICY).
-- - Parents cannot insert assignments.
-- - Existing read policies still hide assignments unless they are linked
--   through accessible assignment_students rows.

alter table if exists public.assignments enable row level security;

create or replace function public.current_profile_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles as p
    where p.id = public.current_profile_id()
      and lower(trim(coalesce(p.role, ''))) = 'teacher'
  );
$$;

revoke all on function public.current_profile_is_teacher() from public;
grant execute on function public.current_profile_is_teacher() to authenticated;

drop policy if exists "user_scoped_insert_assignments" on public.assignments;
create policy "user_scoped_insert_assignments"
  on public.assignments
  for insert
  to authenticated
  with check (
    public.current_profile_id() is not null
    and public.current_profile_is_teacher()
  );
