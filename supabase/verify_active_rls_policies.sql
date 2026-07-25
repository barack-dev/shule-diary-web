-- READ-ONLY RLS VERIFICATION QUERIES
--
-- Run these in the Supabase SQL Editor after applying migrations.
-- These queries inspect catalog metadata only; they do not change data or
-- policies.

-- 1) List all active public policies.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 2) Confirm the assignments insert policy is teacher-only.
-- Expected: with_check should include public.current_profile_is_teacher().
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'assignments'
  and policyname = 'user_scoped_insert_assignments';

-- 3) Confirm the assignment_students insert policy is teacher-only.
-- Expected: with_check should include public.current_profile_is_teacher()
-- and c.teacher_id = public.current_profile_id().
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'assignment_students'
  and policyname = 'user_scoped_insert_assignment_students';

-- 4) Look for leftover temporary/demo policies.
-- Expected: zero rows.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and (
    policyname ilike 'temp%'
    or policyname ilike '%temporary%'
    or policyname ilike '%demo%'
  )
order by tablename, policyname;

-- 5) Look for broad true-based policies on protected app tables.
-- Expected: zero rows.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'classes',
    'students',
    'student_guardians',
    'assignments',
    'assignment_students',
    'comments',
    'schools',
    'milestones',
    'assignment_comments'
  )
  and (
    lower(coalesce(qual, '')) in ('true', '(true)')
    or lower(coalesce(with_check, '')) in ('true', '(true)')
  )
order by tablename, policyname;

-- 6) Confirm RLS is enabled on protected app tables.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls_enabled
from pg_class as c
join pg_namespace as n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles',
    'classes',
    'students',
    'student_guardians',
    'assignments',
    'assignment_students',
    'comments',
    'schools',
    'milestones',
    'assignment_comments'
  )
order by c.relname;

-- 7) Confirm ownership helper functions are SECURITY DEFINER.
select
  p.proname as function_name,
  p.prosecdef as is_security_definer
from pg_proc as p
join pg_namespace as n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'current_profile_id',
    'current_profile_is_teacher',
    'can_access_class',
    'can_access_student',
    'can_access_student_guardian_link',
    'can_access_assignment_student',
    'can_access_assignment'
  )
order by p.proname;
