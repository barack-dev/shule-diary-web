-- LEGACY DEMO AUTH LINK HELPER
--
-- This migration used to create broad demo RLS policies. Those policies have
-- been removed so this file only preserves the harmless demo profile-to-auth
-- linking helper. Production RLS is defined in later hardening migrations.
--
-- No passwords, secrets, or service-role keys are included here.

-- teacher@shulediary.test -> Teacher Grace Wanjiku profile
update public.profiles as p
set auth_user_id = au.id
from auth.users as au
where p.id = '00000000-0000-0000-0000-000000001001'
  and au.email = 'teacher@shulediary.test';

-- parent@shulediary.test -> Parent Mary Otieno profile
update public.profiles as p
set auth_user_id = au.id
from auth.users as au
where p.id = '00000000-0000-0000-0000-000000001002'
  and au.email = 'parent@shulediary.test';

-- Remove any old permissive demo policies if this migration is re-run.
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
