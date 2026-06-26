-- REPAIR: ensure demo parent Mary Otieno is linked to demo child Brian Otieno
--
-- Scope:
-- - Only touches known demo identities/rows.
-- - Keeps existing RLS strategy and helper functions unchanged.
-- - Idempotent and safe to re-run.
--
-- Known demo profile ids:
-- - Teacher Grace Wanjiku: 00000000-0000-0000-0000-000000001001
-- - Parent Mary Otieno:   00000000-0000-0000-0000-000000001002
--
-- Known demo assignment_students row from earlier migrations:
-- - 00000000-0000-0000-0000-000000006001

do $$
declare
  v_parent_profile_id constant text := '00000000-0000-0000-0000-000000001002';
  v_teacher_profile_id constant text := '00000000-0000-0000-0000-000000001001';
  v_demo_assignment_student_id constant text := '00000000-0000-0000-0000-000000006001';
  v_brian_demo_student_id constant text := '00000000-0000-0000-0000-000000003001';

  v_brian_student_id text;
  v_target_class_id text;
  v_has_parent_id boolean := false;
  v_has_guardian_id boolean := false;
  v_has_relationship boolean := false;
  v_has_id boolean := false;
  v_has_created_at boolean := false;
  v_insert_columns text;
  v_insert_values text;
  v_insert_sql text;
begin
  -- If the demo parent profile does not exist in this environment, do nothing.
  if not exists (
    select 1
    from public.profiles p
    where p.id::text = v_parent_profile_id
  ) then
    raise notice 'Demo parent profile % not found; skipping demo parent-child repair.', v_parent_profile_id;
    return;
  end if;

  -- 1) Prefer an existing student explicitly named Brian Otieno.
  select s.id::text
    into v_brian_student_id
  from public.students s
  where lower(trim(coalesce(s.full_name, ''))) = 'brian otieno'
  order by s.id::text
  limit 1;

  -- 2) If no Brian row exists, reuse the known demo assignment student row and
  --    normalize that student's name to Brian Otieno.
  if v_brian_student_id is null then
    select ast.student_id::text
      into v_brian_student_id
    from public.assignment_students ast
    where ast.id::text = v_demo_assignment_student_id
      and ast.student_id is not null
    limit 1;

    if v_brian_student_id is not null then
      update public.students s
      set full_name = 'Brian Otieno'
      where s.id::text = v_brian_student_id
        and coalesce(trim(s.full_name), '') <> 'Brian Otieno';
    end if;
  end if;

  -- 3) If still missing, attempt to create a minimal demo Brian row in a demo
  --    teacher class (fallback to any class if teacher class is not found).
  if v_brian_student_id is null then
    select c.id::text
      into v_target_class_id
    from public.classes c
    where c.teacher_id::text = v_teacher_profile_id
    order by c.id::text
    limit 1;

    if v_target_class_id is null then
      select c.id::text
        into v_target_class_id
      from public.classes c
      order by c.id::text
      limit 1;
    end if;

    if v_target_class_id is not null then
      begin
        insert into public.students (id, full_name, class_id)
        select v_brian_demo_student_id, 'Brian Otieno', c.id
        from public.classes c
        where c.id::text = v_target_class_id
          and not exists (
            select 1
            from public.students s
            where s.id::text = v_brian_demo_student_id
          );
      exception
        when others then
          -- Environments may have stricter student constraints; keep migration safe.
          raise notice 'Could not auto-create Brian Otieno demo student: %', sqlerrm;
      end;

      select s.id::text
        into v_brian_student_id
      from public.students s
      where s.id::text = v_brian_demo_student_id
         or lower(trim(coalesce(s.full_name, ''))) = 'brian otieno'
      order by
        case when s.id::text = v_brian_demo_student_id then 0 else 1 end,
        s.id::text
      limit 1;
    else
      raise notice 'No class row found; unable to auto-create demo Brian Otieno student.';
    end if;
  end if;

  -- 4) Ensure parent->student guardian link exists (idempotent).
  if v_brian_student_id is not null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'student_guardians'
        and column_name = 'parent_id'
    ) into v_has_parent_id;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'student_guardians'
        and column_name = 'guardian_id'
    ) into v_has_guardian_id;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'student_guardians'
        and column_name = 'relationship'
    ) into v_has_relationship;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'student_guardians'
        and column_name = 'id'
    ) into v_has_id;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'student_guardians'
        and column_name = 'created_at'
    ) into v_has_created_at;

    if not v_has_parent_id then
      raise exception 'student_guardians.parent_id column is required for demo parent-child repair.';
    end if;

    v_insert_columns := 'student_id, parent_id';
    v_insert_values := 's.id, p.id';

    if v_has_guardian_id then
      v_insert_columns := v_insert_columns || ', guardian_id';
      v_insert_values := v_insert_values || ', p.id';
    end if;

    if v_has_relationship then
      v_insert_columns := v_insert_columns || ', relationship';
      v_insert_values := v_insert_values || ', ''guardian''';
    end if;

    if v_has_id then
      v_insert_columns := 'id, ' || v_insert_columns;
      v_insert_values := 'gen_random_uuid(), ' || v_insert_values;
    end if;

    if v_has_created_at then
      v_insert_columns := v_insert_columns || ', created_at';
      v_insert_values := v_insert_values || ', now()';
    end if;

    v_insert_sql := format(
      'insert into public.student_guardians (%s) '
      || 'select %s '
      || 'from public.students s '
      || 'join public.profiles p on p.id::text = %L '
      || 'where s.id::text = %L '
      || 'and not exists ('
      || '  select 1 from public.student_guardians sg '
      || '  where sg.student_id = s.id and sg.parent_id = p.id'
      || ')',
      v_insert_columns,
      v_insert_values,
      v_parent_profile_id,
      v_brian_student_id
    );

    execute v_insert_sql;

    -- 5) Repair legacy demo rows where parent_id is set but guardian_id is null.
    -- Keep existing relationship values as-is (for example 'mother').
    if v_has_guardian_id then
      update public.student_guardians sg
      set guardian_id = sg.parent_id
      where sg.student_id::text = v_brian_student_id
        and sg.parent_id::text = v_parent_profile_id
        and sg.guardian_id is null;
    end if;
  else
    raise notice 'Brian Otieno student row was not found or created; no guardian link inserted.';
  end if;
end
$$;
