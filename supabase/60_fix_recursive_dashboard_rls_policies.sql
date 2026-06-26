-- REPAIR: Fix recursive dashboard RLS policies
--
-- Why this exists:
-- - Earlier dashboard policies referenced other RLS-protected tables in ways that
--   could recurse (for example classes <-> students via policy joins).
-- - This migration rebuilds dashboard policies to use SECURITY DEFINER helpers
--   so policy checks are evaluated without re-entering row policies.
--
-- Properties:
-- - Idempotent (safe to run once or multiple times).
-- - Preserves onboarding/profile columns and existing data.
-- - Keeps teacher/parent demo accounts scoped through profile ownership links.

-- ---------------------------------------------------------------------------
-- 0) Ensure RLS is enabled on dashboard tables
-- ---------------------------------------------------------------------------

alter table if exists public.profiles enable row level security;
alter table if exists public.classes enable row level security;
alter table if exists public.students enable row level security;
alter table if exists public.student_guardians enable row level security;
alter table if exists public.assignments enable row level security;
alter table if exists public.assignment_students enable row level security;
alter table if exists public.comments enable row level security;

-- ---------------------------------------------------------------------------
-- 1) Helper functions (SECURITY DEFINER) for ownership checks
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
-- 2) Drop recursive dashboard policies safely
-- ---------------------------------------------------------------------------

drop policy if exists "user_scoped_select_classes" on public.classes;
drop policy if exists "user_scoped_select_students" on public.students;
drop policy if exists "user_scoped_select_student_guardians" on public.student_guardians;
drop policy if exists "user_scoped_select_assignment_students" on public.assignment_students;
drop policy if exists "user_scoped_update_assignment_students_status" on public.assignment_students;
drop policy if exists "user_scoped_select_assignments" on public.assignments;
drop policy if exists "user_scoped_select_comments" on public.comments;
drop policy if exists "user_scoped_insert_comments" on public.comments;
drop policy if exists "user_scoped_update_own_comments" on public.comments;
drop policy if exists "user_scoped_delete_own_comments" on public.comments;

-- ---------------------------------------------------------------------------
-- 3) Recreate safe non-recursive policies
-- ---------------------------------------------------------------------------

create policy "user_scoped_select_classes"
  on public.classes
  for select
  to authenticated
  using (public.can_access_class(classes.id::text));

create policy "user_scoped_select_students"
  on public.students
  for select
  to authenticated
  using (public.can_access_student(students.id::text));

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

create policy "user_scoped_select_assignment_students"
  on public.assignment_students
  for select
  to authenticated
  using (public.can_access_student(assignment_students.student_id::text));

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

create policy "user_scoped_select_assignments"
  on public.assignments
  for select
  to authenticated
  using (public.can_access_assignment(assignments.id::text));

create policy "user_scoped_select_comments"
  on public.comments
  for select
  to authenticated
  using (public.can_access_assignment_student(comments.assignment_student_id::text));

create policy "user_scoped_insert_comments"
  on public.comments
  for insert
  to authenticated
  with check (
    public.current_profile_id() = comments.user_id
    and public.can_access_assignment_student(comments.assignment_student_id::text)
  );

create policy "user_scoped_update_own_comments"
  on public.comments
  for update
  to authenticated
  using (public.current_profile_id() = comments.user_id)
  with check (public.current_profile_id() = comments.user_id);

create policy "user_scoped_delete_own_comments"
  on public.comments
  for delete
  to authenticated
  using (public.current_profile_id() = comments.user_id);
