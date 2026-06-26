# Real SaaS Foundation

## What Was Reviewed

- Next.js route protection for `/`, `/login`, `/onboarding`, and `/dashboard`.
- Supabase browser/server client setup.
- Profile lookup and onboarding completion behavior.
- Dashboard assignment loading, status persistence, and comment persistence.
- Supabase SQL files under `supabase/`.
- Test and CI setup.

## What Changed

- Centralized public environment validation in `lib/env-core.ts` and `lib/env.ts`.
- Shared auth helpers now own profile completeness checks, auth error detection, and profile owner filters.
- Route-decision helpers cover the main auth redirects without duplicating logic in pages.
- Dashboard data loading no longer silently falls back to mock data after Supabase failures.
- Dashboard context no longer reads the first global school, profile, class, student, or milestone row.
- `/supabase-test` now returns a 404 instead of exposing a developer data page.
- Dashboard, login, and onboarding loading states were added.
- A dashboard error boundary was added.
- A minimal Node test foundation and GitHub Actions CI workflow were added.
- Demo-wide RLS policies were removed or superseded by user-scoped policies.

## SaaS Layers Covered

- Auth gate: logged-out, missing-profile, and complete-profile route decisions.
- Profile isolation: profile rows are limited to the authenticated user.
- Assignment isolation: assignment rows are reachable through owned teacher classes or guardian student links.
- Comment isolation: comments are readable only through owned assignment threads, and writable only as the current profile.
- Environment safety: only public Supabase URL and anon key are exposed to client code.
- Reliability: dashboard data errors are visible to the user and logged for developers.
- CI: install, lint, typecheck, tests, and build run in GitHub Actions.

## RLS Assumptions

- `public.profiles.user_id` is the intended source of truth for `auth.users.id`.
- `public.profiles.auth_user_id` remains supported as a legacy compatibility column.
- Teachers own classes through `classes.teacher_id = profiles.id`.
- Students belong to classes through `students.class_id = classes.id`.
- Parents or guardians are linked through `student_guardians.guardian_id = profiles.id` and `student_guardians.student_id = students.id`.
- Assignment ownership flows through `assignment_students.student_id`.
- Comments use `comments.assignment_student_id` and `comments.user_id`, where `comments.user_id` stores `profiles.id`.

## Remaining Gaps

- `schools` and `milestones` do not currently show a safe ownership path in the available schema. Their old authenticated read policies were removed, and dashboard code no longer depends on global reads from those tables.
- The legacy `assignment_comments` table does not contain enough ownership data for safe per-user access, so it remains RLS-protected without permissive policies.
- Database foreign keys and check constraints are still light. Add them only after confirming existing local data will not be broken.
- Full integration tests for real Supabase auth and RLS still need a seeded test database.
- Supabase session refresh middleware/proxy should be added once the desired cookie refresh strategy is finalized.

## Manual Verification Steps

1. Start the app with valid `.env.local` values.
2. Visit `/dashboard` while logged out and confirm redirect to `/login`.
3. Sign in with a user that has no complete profile and confirm redirect to `/onboarding`.
4. Complete onboarding and confirm redirect to `/dashboard`.
5. Refresh `/dashboard` and confirm assignments remain scoped to the signed-in profile.
6. Drag a Kanban card to a new status, refresh, and confirm the status persists.
7. Add an assignment comment, refresh, and confirm the comment persists.
8. Temporarily break Supabase access and confirm the dashboard shows a friendly error instead of mock data.

## Security Notes

- Do not commit `.env.local` or service-role keys.
- The app should use the Supabase anon key on the client and rely on RLS for authorization.
- Any future school or milestone dashboard feature needs explicit ownership columns or join tables before read policies are added.
- Avoid adding policies that grant all authenticated users broad table access.

