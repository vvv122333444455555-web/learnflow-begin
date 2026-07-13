## Overview

Restructure LearnFlow into a fully role-based platform with strict Kids/Adults separation, a dedicated teacher portal with access-code onboarding, a no-code exercise builder, student assignment flows, and an admin console — all on top of the existing design system (Deep Teal / Warm Gold, Tajawal/Cairo, RTL).

## Order of implementation (single build)

### 1. Homepage restructure — Track selection front and center
- Rewrite `src/routes/index.tsx`: hero + two large track cards ("مسار الأطفال" colorful/playful, "مسار الكبار" professional/calm) + a small tertiary "دخول المعلّم" and "دخول الإدارة" links in the footer of the hero.
- Track choice is passed as a query param to `/auth?track=kids|adults`.

### 2. Data model (single migration)
New / extended tables (all with GRANTs + RLS + `has_role`-based policies):

```text
app_role enum      → add 'admin', keep 'teacher'; add 'adult_student','child_student','parent'
profiles           → add: track ('kids'|'adults'), cefr_level, learning_goal
                     ('travel'|'work'|'exam'|'general'), points, badges jsonb,
                     parent_id (uuid, self-FK for kid → parent linkage),
                     teacher_profile_completed bool, specialty_language, bio, avatar_url
teacher_codes      → code (unique), created_by (admin), used_by (uuid null),
                     used_at, expires_at, active
classes            → teacher_id, name, language_id, level, track
class_members      → class_id, student_id
exercises          → teacher_id, class_id (nullable), title, type
                     ('mcq'|'fill_blank'|'matching'|'ordering'|'true_false'|'flashcards'),
                     content jsonb, time_limit_sec, max_attempts, published bool
exercise_assignments → exercise_id, target_type ('class'|'student'), target_id, due_at
exercise_submissions → exercise_id, student_id, answers jsonb, score, max_score,
                       attempt_number, submitted_at
progress           → student_id, language_id, skill ('reading'|'listening'|'writing'|'speaking'|'vocab'|'grammar'),
                     score, updated_at
languages          → seed French, English, Arabic-for-non-natives (keep table, prune/replace rows)
```

RPCs (SECURITY DEFINER): `redeem_teacher_code(code)`, `generate_teacher_codes(count, expires_at)` (admin-only), `submit_exercise(exercise_id, answers)` (auto-grades server-side, writes progress + points).

### 3. Auth & track lock-in
- Update `src/routes/auth.tsx`: read `?track=`, and for Kids track show a Parent-vs-Child sub-choice (parent creates account then adds children).
- Assign the correct role in `user_roles` at signup; write `track` to profile; once set, track is immutable (already enforced by `profiles_block_privileged_updates` — extend it to include `track` + `parent_id`).
- Route guards route users to the correct dashboard shell (`/kids/*` vs `/adults/*`); each subtree checks `profile.track` and redirects.

### 4. Kids experience
- `src/routes/_authenticated/kids/dashboard.tsx`: big colorful cards, mascot, points counter, badges shelf, "دروسي اليوم", "تماريني".
- Parent view (`/kids/parent`): list of linked children with progress rings; "أضف طفلاً" flow that creates a child auth user linked via `parent_id` (via server fn using `supabaseAdmin`).

### 5. Adults experience
- `src/routes/_authenticated/adults/dashboard.tsx`: goal picker (travel/work/exam), CEFR progress bar A1→C2, structured learning path, weekly targets.

### 6. Teacher portal
- New public route `/teacher-login` — enter Teacher Code (no email/password). Server fn `redeem_teacher_code` creates/attaches a Supabase user for that teacher, grants `teacher` role, marks the code used.
- First login → forced onboarding wizard: name, specialty language, photo (Supabase Storage bucket `avatars`), bio.
- Teacher dashboard tabs: **My Students**, **Classes**, **Exercise Builder**, **Messages**.
  - Students: table with per-student progress & recent submissions.
  - Classes: create class, add students, assign exercises.
  - Messaging: simple thread table (`messages`: sender_id, recipient_id, body, read_at) — one-to-one with students and parents.

### 7. Exercise Builder (no-code)
- Route: `/teach/builder` — type picker (6 tiles). Ship **MCQ fully functional first**, then reuse the same schema for the rest.
- MCQ builder: title, question text, options (add/remove), mark correct answer(s), time limit, max attempts. Live preview panel. "نشر إلى" → pick class or student.
- Publishing writes to `exercises` (published=true) + `exercise_assignments`.
- Auto-grading in `submit_exercise` RPC compares stored answer key to submitted answers; writes score + updates `progress` + awards points/badges for Kids.
- Results view: per-exercise submissions list with score distribution.
- After MCQ works end-to-end, add the other 5 types (fill-blank, matching drag&drop, ordering, true/false, flashcards) reusing the same `content jsonb` shape and grader dispatched by `type`.

### 8. Student assigned-exercises page
- `/kids/exercises` and `/adults/exercises`: list of assigned + unattempted, in-progress, completed. Renderer switches on `type`. Overall progress bar + per-skill bars from `progress` table.

### 9. Admin dashboard
- `/admin` (guarded by `has_role('admin')`): 
  - Generate teacher codes (bulk, with expiry) → shows table of codes + status.
  - Manage languages (add/toggle French, English, Arabic-for-non-natives).
  - Platform stats: users by role, active exercises, submissions/week, revenue.
- First admin is bootstrapped via a one-time SQL grant (documented; admin promotes others via `has_role` insert helper RPC).

### 10. Navigation & shell
- `AppShell` becomes track-aware: entirely different sidebar items for kids vs adults vs teacher vs admin. Teacher/Admin links removed from student shells.

## Technical notes

- All server writes go through `createServerFn` with `requireSupabaseAuth` + role checks (never client-side privilege).
- Points/badges awarded inside `submit_exercise` RPC to prevent tampering.
- Parent-adds-child flow uses `supabaseAdmin.auth.admin.createUser` inside a server fn that first verifies caller has `parent` role.
- Teacher photos → Storage bucket `avatars` with per-user RLS.
- Existing Tunisian curriculum, live sessions, checkout, widgets remain untouched and continue to work for the corresponding track.

## Scope acknowledgement

This is a large build (≈1 migration + ~15 new routes + ~8 new components + 3 RPCs). I'll ship it in this single turn, wiring MCQ end-to-end and stubbing the other 5 exercise types on the same schema so they can be filled in immediately after.
