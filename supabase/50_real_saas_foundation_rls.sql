-- REAL SAAS FOUNDATION RLS HARDENING
--
-- Purpose:
-- 1) Remove broad demo policies.
-- 2) Keep profiles isolated to the authenticated user.
-- 3) Scope classes, students, assignments, assignment_students, and comments
--    through teacher/class and guardian/student ownership relationships.
-- 4) Deny schools, milestones, and legacy assignment_comments until a safe
--    ownership relationship is added.
--
-- Source of truth note:
-- - public.profiles.user_id is the intended auth.users.id link.
-- - public.profiles.auth_user_id is preserved as a legacy compatibility link.

-- ---------------------------------------------------------------------------
-- 0) Required ownership columns and indexes
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists auth_user_id uuid;
alter table public.classes add column if not exists teacher_id uuid;
alter table public.students add column if not exists class_id uuid;
alter table public.student_guardians add column if not exists guardian_id uuid;
alter table public.student_guardians add column if not exists student_id uuid;
alter table public.assignment_students add column if not exists student_id uuid;
alter table public.comments add column if not exists user_id uuid;

create unique index if not exists profiles_user_id_unique_idx
  on public.profiles (user_id)
  where user_id is not null;

create unique index if not exists profiles_auth_user_id_unique_idx
  on public.profiles (auth_user_id)
  where auth_user_id is not null;

create index if not exists profiles_auth_lookup_idx
  on public.profiles (user_id, auth_user_id);

create index if not exists classes_teacher_id_idx
  on public.classes (teacher_id);

create index if not exists students_class_id_idx
  on public.students (class_id);

create index if not exists student_guardians_guardian_student_idx
  on public.student_guardians (guardian_id, student_id);

create index if not exists assignment_students_student_id_idx
  on public.assignment_students (student_id);

create index if not exists assignment_students_assignment_id_idx
  on public.assignment_students (assignment_id);

create index if not exists comments_assignment_student_id_idx
  on public.comments (assignment_student_id);

create index if not exists comments_user_id_idx
  on public.comments (user_id);

-- ---------------------------------------------------------------------------
-- 1) Enable RLS and remove demo policies
-- ---------------------------------------------------------------------------

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_students enable row level security;
alter table public.comments enable row level security;
alter table public.milestones enable row level security;
alter table public.assignment_comments enable row level security;

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

-- ---------------------------------------------------------------------------
-- 2) Profiles: authenticated users can only manage their own profile
-- ---------------------------------------------------------------------------

drop policy if exists "user_scoped_select_own_profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  );

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  );

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  )
  with check (
    user_id = auth.uid()
    or auth_user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 3) Helper functions to avoid recursive policy evaluation
-- ---------------------------------------------------------------------------

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles as p
  where p.user_id = auth.uid()
     or p.auth_user_id = auth.uid()
  order by
    case when p.user_id = auth.uid() then 0 else 1 end,
    p.id
  limit 1;
$$;

create or replace function public.can_access_class(p_class_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select public.current_profile_id() as profile_id
  )
  select exists (
    select 1
    from me
    join public.classes as c
      on c.id::text = p_class_id
    where me.profile_id is not null
      and c.teacher_id = me.profile_id
  )
  or exists (
    select 1
    from me
    join public.student_guardians as sg
      on sg.guardian_id = me.profile_id
    join public.students as s
      on s.id = sg.student_id
    where me.profile_id is not null
      and s.class_id::text = p_class_id
  );
$$;

  create or replace function public.can_access_student(p_student_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select public.current_profile_id() as profile_id
  )
  select exists (
    select 1
    from me
    join public.students as s
      on s.id::text = p_student_id
    join public.classes as c
      on c.id = s.class_id
    where me.profile_id is not null
      and c.teacher_id = me.profile_id
  )
  or exists (
    select 1
    from me
    join public.student_guardians as sg
      on sg.student_id::text = p_student_id
    where me.profile_id is not null
      and sg.guardian_id = me.profile_id
  );
$$;

create or replace function public.can_access_student_guardian_link(
  p_student_id text,
  p_guardian_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select public.current_profile_id() as profile_id
  )
  select exists (
    select 1
    from me
    where me.profile_id is not null
      and me.profile_id::text = p_guardian_id
  )
  or exists (
    select 1
    from me
    join public.students as s
      on s.id::text = p_student_id
    join public.classes as c
      on c.id = s.class_id
    where me.profile_id is not null
      and c.teacher_id = me.profile_id
  );
$$;

create or replace function public.can_access_assignment_student(
  p_assignment_student_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select public.current_profile_id() as profile_id
  )
  select exists (
    select 1
    from me
    join public.assignment_students as ast
      on ast.id::text = p_assignment_student_id
    join public.students as s
      on s.id = ast.student_id
    join public.classes as c
      on c.id = s.class_id
    where me.profile_id is not null
      and c.teacher_id = me.profile_id
  )
  or exists (
    select 1
    from me
    join public.assignment_students as ast
      on ast.id::text = p_assignment_student_id
    join public.student_guardians as sg
      on sg.student_id = ast.student_id
    where me.profile_id is not null
      and sg.guardian_id = me.profile_id
  );
$$;

create or replace function public.can_access_assignment(p_assignment_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select public.current_profile_id() as profile_id
  )
  select exists (
    select 1
    from me
    join public.assignment_students as ast
      on ast.assignment_id::text = p_assignment_id
    join public.students as s
      on s.id = ast.student_id
    join public.classes as c
      on c.id = s.class_id
    where me.profile_id is not null
      and c.teacher_id = me.profile_id
  )
  or exists (
    select 1
    from me
    join public.assignment_students as ast
      on ast.assignment_id::text = p_assignment_id
    join public.student_guardians as sg
      on sg.student_id = ast.student_id
    where me.profile_id is not null
      and sg.guardian_id = me.profile_id
  );
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.can_access_class(text) from public;
revoke all on function public.can_access_student(text) from public;
revoke all on function public.can_access_student_guardian_link(text, text) from public;
revoke all on function public.can_access_assignment_student(text) from public;
revoke all on function public.can_access_assignment(text) from public;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.can_access_class(text) to authenticated;
grant execute on function public.can_access_student(text) to authenticated;
grant execute on function public.can_access_student_guardian_link(text, text) to authenticated;
grant execute on function public.can_access_assignment_student(text) to authenticated;
grant execute on function public.can_access_assignment(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Dashboard policies rebuilt with non-recursive helper checks
-- ---------------------------------------------------------------------------

drop policy if exists "user_scoped_select_classes" on public.classes;
create policy "user_scoped_select_classes"
  on public.classes
  for select
  to authenticated
  using (public.can_access_class(classes.id::text));

drop policy if exists "user_scoped_select_students" on public.students;
create policy "user_scoped_select_students"
  on public.students
  for select
  to authenticated
  using (public.can_access_student(students.id::text));

drop policy if exists "user_scoped_select_student_guardians" on public.student_guardians;
create policy "user_scoped_select_student_guardians"
  on public.student_guardians
  for select
  to authenticated
  using (
    public.can_access_student_guardian_link(
      student_guardians.student_id::text,
      student_guardians.guardian_id::text
    )
  );

-- ---------------------------------------------------------------------------
-- 5) Assignment and comments policies without cross-policy recursion
-- ---------------------------------------------------------------------------

drop policy if exists "user_scoped_select_assignment_students" on public.assignment_students;
create policy "user_scoped_select_assignment_students"
  on public.assignment_students
  for select
  to authenticated
  using (public.can_access_student(assignment_students.student_id::text));

drop policy if exists "user_scoped_update_assignment_students_status" on public.assignment_students;
create policy "user_scoped_update_assignment_students_status"
  on public.assignment_students
  for update
  to authenticated
  using (public.can_access_student(assignment_students.student_id::text))
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
    and public.can_access_student(assignment_students.student_id::text)
  );

drop policy if exists "user_scoped_select_assignments" on public.assignments;
create policy "user_scoped_select_assignments"
  on public.assignments
  for select
  to authenticated
  using (public.can_access_assignment(assignments.id::text));

drop policy if exists "user_scoped_select_comments" on public.comments;
create policy "user_scoped_select_comments"
  on public.comments
  for select
  to authenticated
  using (public.can_access_assignment_student(comments.assignment_student_id::text));

drop policy if exists "user_scoped_insert_comments" on public.comments;
create policy "user_scoped_insert_comments"
  on public.comments
  for insert
  to authenticated
  with check (
    public.current_profile_id() = comments.user_id
    and public.can_access_assignment_student(comments.assignment_student_id::text)
  );

drop policy if exists "user_scoped_update_own_comments" on public.comments;
create policy "user_scoped_update_own_comments"
  on public.comments
  for update
  to authenticated
  using (public.current_profile_id() = comments.user_id)
  with check (public.current_profile_id() = comments.user_id);

drop policy if exists "user_scoped_delete_own_comments" on public.comments;
create policy "user_scoped_delete_own_comments"
  on public.comments
  for delete
  to authenticated
  using (public.current_profile_id() = comments.user_id);

