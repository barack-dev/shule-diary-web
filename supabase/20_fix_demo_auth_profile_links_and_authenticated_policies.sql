-- TEMPORARY DEVELOPMENT / DEMO ONLY
--
-- Purpose:
-- 1) Link existing demo profiles in public.profiles to Supabase Auth users by email.
-- 2) Provide temporary authenticated RLS policies for demo read/write flows.
--
-- IMPORTANT:
-- - This is intentionally permissive for demo/development only.
-- - Replace with least-privilege, role-based policies before production.
-- - No passwords, secrets, or service keys are included here.

-- -----------------------------------------------------------------------------
-- 1) Link demo auth users to existing profiles by email (no hardcoded auth UUIDs)
-- -----------------------------------------------------------------------------

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

-- -----------------------------------------------------------------------------
-- 2) Temporary authenticated read policies
-- -----------------------------------------------------------------------------

alter table public.schools enable row level security;
drop policy if exists "temp_demo_authenticated_select_schools" on public.schools;
create policy "temp_demo_authenticated_select_schools"
  on public.schools
  for select
  to authenticated
  using (true);

alter table public.profiles enable row level security;
drop policy if exists "temp_demo_authenticated_select_profiles" on public.profiles;
create policy "temp_demo_authenticated_select_profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

alter table public.classes enable row level security;
drop policy if exists "temp_demo_authenticated_select_classes" on public.classes;
create policy "temp_demo_authenticated_select_classes"
  on public.classes
  for select
  to authenticated
  using (true);

alter table public.students enable row level security;
drop policy if exists "temp_demo_authenticated_select_students" on public.students;
create policy "temp_demo_authenticated_select_students"
  on public.students
  for select
  to authenticated
  using (true);

alter table public.student_guardians enable row level security;
drop policy if exists "temp_demo_authenticated_select_student_guardians" on public.student_guardians;
create policy "temp_demo_authenticated_select_student_guardians"
  on public.student_guardians
  for select
  to authenticated
  using (true);

alter table public.assignments enable row level security;
drop policy if exists "temp_demo_authenticated_select_assignments" on public.assignments;
create policy "temp_demo_authenticated_select_assignments"
  on public.assignments
  for select
  to authenticated
  using (true);

alter table public.assignment_students enable row level security;
drop policy if exists "temp_demo_authenticated_select_assignment_students" on public.assignment_students;
create policy "temp_demo_authenticated_select_assignment_students"
  on public.assignment_students
  for select
  to authenticated
  using (true);

alter table public.comments enable row level security;
drop policy if exists "temp_demo_authenticated_select_comments" on public.comments;
create policy "temp_demo_authenticated_select_comments"
  on public.comments
  for select
  to authenticated
  using (true);

alter table public.milestones enable row level security;
drop policy if exists "temp_demo_authenticated_select_milestones" on public.milestones;
create policy "temp_demo_authenticated_select_milestones"
  on public.milestones
  for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 3) Temporary authenticated write policies
-- -----------------------------------------------------------------------------

-- Allow authenticated users to insert comments for demo/development.
drop policy if exists "temp_demo_authenticated_insert_comments" on public.comments;
create policy "temp_demo_authenticated_insert_comments"
  on public.comments
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update assignment_students for demo status changes.
-- Demo assignment_students row commonly used in tests:
-- 00000000-0000-0000-0000-000000006001
drop policy if exists "temp_demo_authenticated_update_assignment_students_status" on public.assignment_students;
create policy "temp_demo_authenticated_update_assignment_students_status"
  on public.assignment_students
  for update
  to authenticated
  using (true)
  with check (
    status in (
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

-- -----------------------------------------------------------------------------
-- 4) Verification query
-- -----------------------------------------------------------------------------

select
  p.id as profile_id,
  p.full_name,
  p.role,
  p.auth_user_id,
  au.email as linked_auth_email
from public.profiles as p
left join auth.users as au
  on au.id = p.auth_user_id
where p.id in (
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000001002'
)
order by p.id;
