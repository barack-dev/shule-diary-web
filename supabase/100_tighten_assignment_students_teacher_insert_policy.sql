-- HARDENING: assignment_students inserts must be teacher-only
--
-- Why this exists:
-- - The previous insert policy used public.can_access_student(...).
-- - That helper intentionally allows both teachers and linked parents to read
--   owned students, so it is too broad for creating assignment_students rows.
--
-- Safety:
-- - Idempotent (CREATE OR REPLACE FUNCTION + DROP/CREATE POLICY).
-- - Keeps parent/teacher read and status update policies unchanged.
-- - Does not weaken existing RLS.

alter table if exists public.assignment_students enable row level security;

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

drop policy if exists "user_scoped_insert_assignment_students" on public.assignment_students;
create policy "user_scoped_insert_assignment_students"
  on public.assignment_students
  for insert
  to authenticated
  with check (
    public.current_profile_id() is not null
    and public.current_profile_is_teacher()
    and assignment_students.assignment_id is not null
    and assignment_students.student_id is not null
    and status in (
      'assigned',
      'seen',
      'in_progress',
      'submitted',
      'reviewed',
      'completed',
      'needs_support',
      'overdue'
    )
    and exists (
      select 1
      from public.students as s
      join public.classes as c
        on c.id::text = s.class_id::text
      where s.id::text = assignment_students.student_id::text
        and c.teacher_id = public.current_profile_id()
    )
  );
