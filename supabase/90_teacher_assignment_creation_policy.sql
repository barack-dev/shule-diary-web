-- MILESTONE 12A: teacher assignment creation RLS policy
--
-- Purpose:
-- 1) Allow authenticated teachers to create assignments.
-- 2) Allow authenticated teachers to create assignment_students rows only for
--    students in classes they own.
-- 3) Keep parent/teacher read and status/comment behavior from prior migrations.
--
-- Safety:
-- - Idempotent (DROP POLICY IF EXISTS + CREATE POLICY).
-- - No broad true-based policies.
-- - No recursive policy graph introduced.

alter table if exists public.assignments enable row level security;
alter table if exists public.assignment_students enable row level security;

drop policy if exists "user_scoped_insert_assignments" on public.assignments;
create policy "user_scoped_insert_assignments"
  on public.assignments
  for insert
  to authenticated
  with check (
    public.current_profile_id() is not null
    and exists (
      select 1
      from public.classes c
      where c.teacher_id = public.current_profile_id()
    )
  );

drop policy if exists "user_scoped_insert_assignment_students" on public.assignment_students;
create policy "user_scoped_insert_assignment_students"
  on public.assignment_students
  for insert
  to authenticated
  with check (
    public.can_access_student(assignment_students.student_id::text)
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
  );
