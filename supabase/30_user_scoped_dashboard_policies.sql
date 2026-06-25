-- DEVELOPMENT / DEMO TRANSITION: user-scoped dashboard access
--
-- Purpose:
-- 1) Scope dashboard assignment reads/writes to the authenticated owner.
-- 2) Scope comments read/insert/update/delete to owned assignments and own author profile.
-- 3) Replace temporary permissive authenticated policies from demo setup.
--
-- Notes:
-- - This script is idempotent and safe to re-run.
-- - It does not include secrets.
-- - It relies on profiles.auth_user_id being linked to auth.users.id.

-- -----------------------------------------------------------------------------
-- 0) Ensure ownership columns needed by policies exist
-- -----------------------------------------------------------------------------

alter table public.classes add column if not exists teacher_id uuid;
alter table public.students add column if not exists class_id uuid;
alter table public.student_guardians add column if not exists guardian_id uuid;
alter table public.student_guardians add column if not exists student_id uuid;
alter table public.assignment_students add column if not exists student_id uuid;
alter table public.comments add column if not exists user_id uuid;

-- Helpful indexes for policy predicates.
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

-- -----------------------------------------------------------------------------
-- 1) Optional demo backfill helpers (safe no-op if rows already linked)
-- -----------------------------------------------------------------------------

-- Known demo profile ids.
-- Teacher: 00000000-0000-0000-0000-000000001001
-- Parent:  00000000-0000-0000-0000-000000001002
-- Demo assignment_students row: 00000000-0000-0000-0000-000000006001

-- Backfill comments without an owner to demo teacher (optional demo cleanup).
update public.comments
set user_id = '00000000-0000-0000-0000-000000001001'
where user_id is null;

-- Link the class that owns the demo assignment student to demo teacher.
update public.classes as c
set teacher_id = '00000000-0000-0000-0000-000000001001'
where c.id in (
  select s.class_id
  from public.assignment_students as ast
  join public.students as s
    on s.id = ast.student_id
  where ast.id = '00000000-0000-0000-0000-000000006001'
    and s.class_id is not null
);

-- Link the same demo student to demo parent if missing.
insert into public.student_guardians (student_id, guardian_id)
select ast.student_id, '00000000-0000-0000-0000-000000001002'
from public.assignment_students as ast
where ast.id = '00000000-0000-0000-0000-000000006001'
  and ast.student_id is not null
  and not exists (
    select 1
    from public.student_guardians as sg
    where sg.student_id = ast.student_id
      and sg.guardian_id = '00000000-0000-0000-0000-000000001002'
  );

-- -----------------------------------------------------------------------------
-- 2) Enable RLS on user-scoped tables
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_students enable row level security;
alter table public.comments enable row level security;

-- Remove old permissive demo policies if they exist.
drop policy if exists "temp_demo_authenticated_select_profiles" on public.profiles;
drop policy if exists "temp_demo_authenticated_select_classes" on public.classes;
drop policy if exists "temp_demo_authenticated_select_students" on public.students;
drop policy if exists "temp_demo_authenticated_select_student_guardians" on public.student_guardians;
drop policy if exists "temp_demo_authenticated_select_assignments" on public.assignments;
drop policy if exists "temp_demo_authenticated_select_assignment_students" on public.assignment_students;
drop policy if exists "temp_demo_authenticated_select_comments" on public.comments;
drop policy if exists "temp_demo_authenticated_insert_comments" on public.comments;
drop policy if exists "temp_demo_authenticated_update_assignment_students_status" on public.assignment_students;

-- -----------------------------------------------------------------------------
-- 3) Profiles: users can read only their own profile row
-- -----------------------------------------------------------------------------

drop policy if exists "user_scoped_select_own_profile" on public.profiles;
create policy "user_scoped_select_own_profile"
  on public.profiles
  for select
  to authenticated
  using (auth_user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4) Students / classes / guardians ownership graph
-- -----------------------------------------------------------------------------

drop policy if exists "user_scoped_select_classes" on public.classes;
create policy "user_scoped_select_classes"
  on public.classes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as p
      where p.auth_user_id = auth.uid()
        and p.id = classes.teacher_id
    )
    or exists (
      select 1
      from public.profiles as p
      join public.student_guardians as sg
        on sg.guardian_id = p.id
      join public.students as s
        on s.id = sg.student_id
      where p.auth_user_id = auth.uid()
        and s.class_id = classes.id
    )
  );

drop policy if exists "user_scoped_select_students" on public.students;
create policy "user_scoped_select_students"
  on public.students
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as p
      join public.classes as c
        on c.teacher_id = p.id
      where p.auth_user_id = auth.uid()
        and c.id = students.class_id
    )
    or exists (
      select 1
      from public.profiles as p
      join public.student_guardians as sg
        on sg.guardian_id = p.id
      where p.auth_user_id = auth.uid()
        and sg.student_id = students.id
    )
  );

drop policy if exists "user_scoped_select_student_guardians" on public.student_guardians;
create policy "user_scoped_select_student_guardians"
  on public.student_guardians
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as p
      where p.auth_user_id = auth.uid()
        and p.id = student_guardians.guardian_id
    )
    or exists (
      select 1
      from public.profiles as p
      join public.students as s
        on s.id = student_guardians.student_id
      join public.classes as c
        on c.id = s.class_id
      where p.auth_user_id = auth.uid()
        and c.teacher_id = p.id
    )
  );

-- -----------------------------------------------------------------------------
-- 5) Assignment ownership (read/update only owned student assignments)
-- -----------------------------------------------------------------------------

drop policy if exists "user_scoped_select_assignment_students" on public.assignment_students;
create policy "user_scoped_select_assignment_students"
  on public.assignment_students
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as p
      join public.students as s
        on s.id = assignment_students.student_id
      join public.classes as c
        on c.id = s.class_id
      where p.auth_user_id = auth.uid()
        and c.teacher_id = p.id
    )
    or exists (
      select 1
      from public.profiles as p
      join public.student_guardians as sg
        on sg.guardian_id = p.id
      where p.auth_user_id = auth.uid()
        and sg.student_id = assignment_students.student_id
    )
  );

drop policy if exists "user_scoped_update_assignment_students_status" on public.assignment_students;
create policy "user_scoped_update_assignment_students_status"
  on public.assignment_students
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as p
      join public.students as s
        on s.id = assignment_students.student_id
      join public.classes as c
        on c.id = s.class_id
      where p.auth_user_id = auth.uid()
        and c.teacher_id = p.id
    )
    or exists (
      select 1
      from public.profiles as p
      join public.student_guardians as sg
        on sg.guardian_id = p.id
      where p.auth_user_id = auth.uid()
        and sg.student_id = assignment_students.student_id
    )
  )
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
    and (
      exists (
        select 1
        from public.profiles as p
        join public.students as s
          on s.id = assignment_students.student_id
        join public.classes as c
          on c.id = s.class_id
        where p.auth_user_id = auth.uid()
          and c.teacher_id = p.id
      )
      or exists (
        select 1
        from public.profiles as p
        join public.student_guardians as sg
          on sg.guardian_id = p.id
        where p.auth_user_id = auth.uid()
          and sg.student_id = assignment_students.student_id
      )
    )
  );

drop policy if exists "user_scoped_select_assignments" on public.assignments;
create policy "user_scoped_select_assignments"
  on public.assignments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.assignment_students as ast
      join public.students as s
        on s.id = ast.student_id
      join public.classes as c
        on c.id = s.class_id
      join public.profiles as p
        on p.id = c.teacher_id
      where ast.assignment_id = assignments.id
        and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignment_students as ast
      join public.student_guardians as sg
        on sg.student_id = ast.student_id
      join public.profiles as p
        on p.id = sg.guardian_id
      where ast.assignment_id = assignments.id
        and p.auth_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 6) Comments: read owned assignment threads; write/update/delete own comments
-- -----------------------------------------------------------------------------

drop policy if exists "user_scoped_select_comments" on public.comments;
create policy "user_scoped_select_comments"
  on public.comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.assignment_students as ast
      join public.students as s
        on s.id = ast.student_id
      join public.classes as c
        on c.id = s.class_id
      join public.profiles as p
        on p.id = c.teacher_id
      where ast.id = comments.assignment_student_id
        and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.assignment_students as ast
      join public.student_guardians as sg
        on sg.student_id = ast.student_id
      join public.profiles as p
        on p.id = sg.guardian_id
      where ast.id = comments.assignment_student_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "user_scoped_insert_comments" on public.comments;
create policy "user_scoped_insert_comments"
  on public.comments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles as self
      where self.auth_user_id = auth.uid()
        and self.id = comments.user_id
    )
    and (
      exists (
        select 1
        from public.assignment_students as ast
        join public.students as s
          on s.id = ast.student_id
        join public.classes as c
          on c.id = s.class_id
        join public.profiles as p
          on p.id = c.teacher_id
        where ast.id = comments.assignment_student_id
          and p.auth_user_id = auth.uid()
      )
      or exists (
        select 1
        from public.assignment_students as ast
        join public.student_guardians as sg
          on sg.student_id = ast.student_id
        join public.profiles as p
          on p.id = sg.guardian_id
        where ast.id = comments.assignment_student_id
          and p.auth_user_id = auth.uid()
      )
    )
  );

drop policy if exists "user_scoped_update_own_comments" on public.comments;
create policy "user_scoped_update_own_comments"
  on public.comments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as self
      where self.auth_user_id = auth.uid()
        and self.id = comments.user_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles as self
      where self.auth_user_id = auth.uid()
        and self.id = comments.user_id
    )
  );

drop policy if exists "user_scoped_delete_own_comments" on public.comments;
create policy "user_scoped_delete_own_comments"
  on public.comments
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as self
      where self.auth_user_id = auth.uid()
        and self.id = comments.user_id
    )
  );
