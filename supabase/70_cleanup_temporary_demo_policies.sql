-- CLEANUP: remove temporary broad demo/authenticated policies after user-scoped RLS rollout
--
-- Purpose:
-- 1) Remove legacy temporary policies that may still exist in long-lived local DBs.
-- 2) Keep current user-scoped policies from 50/60 as the source of truth.
-- 3) Avoid reintroducing recursive policy logic.
--
-- Safety:
-- - Idempotent (DROP POLICY IF EXISTS only).
-- - Does not remove helper functions from migration 60.
-- - Does not remove onboarding/profile columns.
-- - Does not remove demo data.
-- - Current app runtime does not query public.schools or public.milestones;
--   temporary read policies on those tables are removed intentionally.

-- ---------------------------------------------------------------------------
-- 1) Drop known legacy temp/demo policy names used across earlier iterations
-- ---------------------------------------------------------------------------

drop policy if exists "temp_demo_authenticated_select_schools" on public.schools;
drop policy if exists "temp_demo_authenticated_select_profiles" on public.profiles;
drop policy if exists "temp_demo_authenticated_select_classes" on public.classes;
drop policy if exists "temp_demo_authenticated_select_students" on public.students;
drop policy if exists "temp_demo_authenticated_select_student_guardians" on public.student_guardians;
drop policy if exists "temp_demo_authenticated_select_assignments" on public.assignments;
drop policy if exists "temp_demo_authenticated_select_assignment_students" on public.assignment_students;
drop policy if exists "temp_demo_authenticated_select_comments" on public.comments;
drop policy if exists "temp_demo_authenticated_select_milestones" on public.milestones;
drop policy if exists "temp_demo_authenticated_insert_comments" on public.comments;
drop policy if exists "temp_demo_authenticated_update_assignment_students_status" on public.assignment_students;

drop policy if exists "demo_select_assignment_comments" on public.assignment_comments;
drop policy if exists "demo_insert_assignment_comments" on public.assignment_comments;
drop policy if exists "demo_update_assignment_status" on public.assignments;
drop policy if exists "demo_update_assignments_status" on public.assignments;

-- ---------------------------------------------------------------------------
-- 2) Drop broad temporary name variants seen in manual SQL editor experiments
-- ---------------------------------------------------------------------------

drop policy if exists "Temporary authenticated read schools" on public.schools;
drop policy if exists "Temporary demo read schools" on public.schools;
drop policy if exists "Temporary authenticated read milestones" on public.milestones;
drop policy if exists "Temporary demo read milestones" on public.milestones;

drop policy if exists "Temporary authenticated read classes" on public.classes;
drop policy if exists "Temporary demo read classes" on public.classes;
drop policy if exists "Temporary authenticated read students" on public.students;
drop policy if exists "Temporary demo read students" on public.students;
drop policy if exists "Temporary authenticated read assignments" on public.assignments;
drop policy if exists "Temporary demo read assignments" on public.assignments;
drop policy if exists "Temporary authenticated read assignment students" on public.assignment_students;
drop policy if exists "Temporary demo read assignment students" on public.assignment_students;

-- ---------------------------------------------------------------------------
-- 3) Defensive cleanup for unexpected temporary/demo policy labels
-- ---------------------------------------------------------------------------

-- Remove policies on dashboard tables whose names clearly indicate temporary
-- demo/test intent. This avoids leaving hidden permissive policies in place.
do $$
declare
  rec record;
begin
  for rec in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'classes',
        'students',
        'student_guardians',
        'assignments',
        'assignment_students',
        'comments',
        'profiles',
        'schools',
        'milestones',
        'assignment_comments'
      )
      and (
        policyname ilike 'temp%'
        or policyname ilike '%temporary%'
        or policyname ilike '%demo%'
      )
      and policyname not in (
        'user_scoped_select_classes',
        'user_scoped_select_students',
        'user_scoped_select_student_guardians',
        'user_scoped_select_assignment_students',
        'user_scoped_update_assignment_students_status',
        'user_scoped_select_assignments',
        'user_scoped_select_comments',
        'user_scoped_insert_comments',
        'user_scoped_update_own_comments',
        'user_scoped_delete_own_comments',
        'profiles_select_own',
        'profiles_insert_own',
        'profiles_update_own'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      rec.policyname,
      rec.schemaname,
      rec.tablename
    );
  end loop;
end
$$;