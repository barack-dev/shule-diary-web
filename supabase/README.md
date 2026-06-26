# Supabase Migrations Notes

This folder contains the SQL migrations used to move from demo auth/data access to user-scoped SaaS-safe access.

## Key Migrations

- 20_fix_demo_auth_profile_links_and_authenticated_policies.sql
  - Links demo profiles to auth users for teacher and parent test accounts.
  - Removes old temporary demo authenticated policies if they still exist.

- 30_user_scoped_dashboard_policies.sql
  - First user-scoped dashboard policy rollout for classes/students/assignments/comments.
  - Historical transition step; later superseded by safer recursive-fix migrations.

- 40_profiles_onboarding_and_rls.sql
  - Ensures onboarding/profile columns exist.
  - Adds strict self-only profile policies:
    - profiles_select_own
    - profiles_insert_own
    - profiles_update_own

- 50_real_saas_foundation_rls.sql
  - Hardens RLS baseline and removes broad demo policies.
  - Defines user-scoped policy set and helper checks as the production foundation.

- 60_fix_recursive_dashboard_rls_policies.sql
  - Fixes recursive classes/students dashboard RLS evaluation.
  - Adds SECURITY DEFINER helpers:
    - current_profile_id
    - can_access_class
    - can_access_student
    - can_access_student_guardian_link
    - can_access_assignment_student
    - can_access_assignment
  - Recreates dashboard policies to call helpers and avoid recursive policy loops.

- 70_cleanup_temporary_demo_policies.sql
  - Removes leftover temporary/broad demo policies (including manual SQL Editor name variants).
  - Keeps user-scoped policies and helper functions intact.

## Apply Order

Apply in numeric order:

1. 20_fix_demo_auth_profile_links_and_authenticated_policies.sql
2. 30_user_scoped_dashboard_policies.sql
3. 40_profiles_onboarding_and_rls.sql
4. 50_real_saas_foundation_rls.sql
5. 60_fix_recursive_dashboard_rls_policies.sql
6. 70_cleanup_temporary_demo_policies.sql

## Production Guidance

- Keep 60 and 70 applied in every environment.
- Do not add broad authenticated policies (for example, policies that effectively allow all authenticated users).
- If a local-only temporary policy is needed for debugging, add it in a dedicated local-only script and remove it before shipping.
