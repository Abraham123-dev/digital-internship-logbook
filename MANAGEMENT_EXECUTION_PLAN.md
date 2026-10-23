# Management App Execution Plan

## Goal

Add the next digital logbook features in one Django app named `management`, while keeping the existing `auth` app focused on accounts, sign-in, and invitations. The app covers cohorts, SWEP attendance, coordinator review and grading, SIWES supervisor reviews, and admin management.

All API routes use the existing `/api/v1/` prefix and JSON responses. Protected endpoints use the current JWT `Authorization: Bearer <access-token>` header. Supervisors do not need accounts; their review link token is sent in the `X-Supervisor-Token` header and only grants access to its own review batch.

## MVP implementation choices

- Use ordinary Django models, serializers, and DRF API views. Keep the logic close to the endpoints and avoid extra service layers unless code duplication makes one useful.
- Use the existing `LogrAccount`, student/coordinator profiles, Django cache, and Gmail sender. Use Cloudinary through `CLOUDINARY_URL` for private media. Do not add Redis, Celery, Argon2, or a second user system.
- Send event emails inline through the existing Gmail service. Periodic reminder emails and scheduled jobs are deferred; date-based states are calculated when data is read.
- Use Django cache for short-lived attendance codes and wrong-attempt counters. Store only the salted hash of an attendance code in the database. The coordinator may see the active plain code from cache; student responses never contain it.
- For attendance history, derive `ABSENT` when a session was held for that cohort working day and the student has no attendance record. This avoids a nightly job and extra writes.
- Upload logbook photos and drawn supervisor signatures to Cloudinary as private files, with file type and size checks. Store the Cloudinary identifier on the related row. Do not add background thumbnail work in the MVP.
- Keep supervisor review to written feedback and a signature. No numeric supervisor score and no additional email verification code; the single-use link token is sufficient.

## 1. Cohorts

Coordinator endpoints:

- `POST /coordinator/cohorts/` creates a cohort for the coordinator's own department.
- `PATCH /coordinator/cohorts/{id}/` updates an editable cohort.
- `GET /cohorts/current/` returns a student's current cohort and calculated week/day.
- `GET /admin/cohorts/` and `PATCH /admin/cohorts/{id}/` let an admin list and manage cohorts.

The cohort stores programme (`SWEP` or `SIWES`), session, department, coordinator, start/end dates, working weekdays, holidays, and only the small settings needed by deadlines, reviews, and attendance. Validate that the start date is before the end date and at least one working weekday is selected.

Assignment is automatic. When a cohort is created, attach existing students with the same department and programme who do not already have a cohort, and set their coordinator to the cohort creator. At student signup, attach the student to a matching upcoming or active cohort when one exists; otherwise leave the cohort empty. Do not add a manual enrollment step. Keep the admin reassignment endpoint as an exceptional correction path.

Prevent date/holiday edits that would invalidate saved entries, following the document's `cohort_started` and `holiday_has_entry` errors. Derive cohort status and week/day numbers from dates rather than relying on a scheduled task.

## 2. SWEP attendance

Student endpoints:

- `POST /student/attendance/` submits the short code for today's open session.
- `GET /student/attendance/history/` returns PRESENT, EXCUSED, and derived ABSENT days with a summary.

Coordinator endpoints:

- `POST /coordinator/attendance/sessions/` opens an attendance session for a SWEP cohort working day.
- `GET /coordinator/attendance/sessions/current/` returns the active code, time remaining, and present count.
- `POST /coordinator/attendance/sessions/{id}/end/` ends a session early.
- `POST /coordinator/students/{student_id}/attendance/` marks a student PRESENT or EXCUSED with a required reason.

Keep the code lifetime short (1–3 minutes, with the cohort default capped at 3 minutes) and enforce the cohort's daily session limit. Replacing an active code ends the old session. A student's check-in is unique per day; repeating a successful submission returns the existing record. Limit wrong attempts per student/session using Django cache. Attendance applies to SWEP students only; return `not_applicable` for SIWES.

## 3. Coordinator review, extensions, and grading

Coordinator endpoints:

- `GET /coordinator/dashboard/` returns counts and today's attendance summary.
- `GET /coordinator/students/` lists only students assigned to that coordinator, with simple filters and search.
- `GET /coordinator/students/{id}/` returns the student's week statuses and progress.
- `GET /coordinator/weeks/{id}/` returns a submitted/returned/reviewed week and its entries.
- `PUT /coordinator/entries/{id}/review/` creates or updates a 1–5 rating and comment for one entry.
- `POST /coordinator/weeks/{id}/finish/` finishes the review once every written entry has a rating.
- `POST /coordinator/weeks/{id}/return/` returns a week for edits with a required comment.
- `POST /student/logbook/weeks/{week_no}/extension-request/` requests more time inside the cohort's request window.
- `GET /coordinator/extension-requests/` and `POST /coordinator/extension-requests/{id}/decision/` let the coordinator approve a bounded number of extra days or reject with a reason.

Students can edit returned weeks until the correction deadline. Coordinators can only review students in their department/assignment scope. A week in a sent or completed supervisor batch cannot be returned unless an admin voids that batch first. Calculate the logbook score from coordinator ratings only; missed-week scoring defaults to excluded as stated in the document.

## 4. SIWES supervisor review

Student endpoints:

- `POST /logbook/supervisor-reviews/` sends the next batch of eligible, previously unsent submitted/reviewed weeks to the supervisor.
- `POST /logbook/supervisor-reviews/{id}/resend/` sends a replacement link when allowed.
- `GET /logbook/supervisor-reviews/` lists unsent weeks and prior batches for the student.

Supervisor endpoints:

- `GET /supervisor/review/` reads only the batch associated with the `X-Supervisor-Token` header.
- `POST /supervisor/review/` submits written review and either a drawn PNG signature or typed name plus confirmation.
- `POST /supervisor/review/request-new-link/` notifies the student to resend the link; it does not create a token.

On send, include all eligible weeks not linked to any previous batch, in week order; the student can send weekly or wait and send several together. Store supervisor contact details and a snapshot on each batch. Generate a random single-use token, store only its hash, and expire it after 14 days. The raw token is only included in the email link. A batch review is immutable after submission; admin voiding is the only way to release its weeks. The supervisor's review is feedback and signature only; grading belongs to the coordinator.

Private logbook images and signatures are served through short-lived Cloudinary signed URLs. Validate uploaded file type and size before storing.

## 5. Admin management

All admin routes require a superuser token and a simple `IsAdmin` permission. Implement the actions listed in the document:

- `GET /admin/overview/` and `GET /admin/users/` with basic role, status, and text filters.
- `PATCH /admin/users/{id}/status/` sets the chosen account status and reason, then invalidates its refresh tokens.
- `DELETE /admin/users/{id}/` is a separately confirmed hard delete; record the audit event before deletion.
- `POST /admin/students/{id}/reassign/` changes a student's coordinator.
- `POST /admin/coordinators/{id}/reassign/` moves assigned students and upcoming/active cohorts to another matching coordinator, then deactivates the old coordinator.
- `PATCH /admin/students/{id}/programme/` changes programme only before any logbook entries exist.
- `GET /admin/reports/` returns basic counts; `?format=csv` downloads a CSV report.
- `GET /admin/audit-logs/` lists admin actions with simple actor/action/date filters.

Keep records for withdrawn, rusticated, and deactivated users. Use one small audit-log model for actions that change account, cohort, programme, assignment, or review-batch state.

## 6. Build order

1. Create and register `backend.management`; define cohort, holiday, attendance, entry review, supervisor review/token, and audit models with simple relationships and choices.
2. Add migrations and Django admin registrations; create minimal serializers and permissions.
3. Build cohort creation, automatic student assignment, current cohort response, and admin cohort editing.
4. Build SWEP attendance session/check-in/history/override flows.
5. Build coordinator review, grading, finish, and return flows.
6. Build SIWES supervisor batch, token-only read, submit, and resend flows. Upload private photos and drawn signatures to Cloudinary and return short-lived signed URLs.
7. Build the admin overview, account status and assignment actions, reports, and audit-log endpoints.
8. Add each route under `/api/v1/`, document JSON bodies/responses in the frontend guide, and run migrations, Django checks, and focused endpoint tests.

## Validation focus

- Automatic assignment matches both programme and department; existing cohort assignments are not overwritten.
- Cohort and week calculations use Lagos-local dates, including mid-week cohort starts and holidays.
- SWEP attendance codes expire and are replaced correctly; wrong-attempt limits and repeat submissions behave as specified; SIWES is rejected.
- Coordinators cannot access another department's students or weeks; every week entry must be rated before finishing.
- Supervisor tokens expire, are single-use, and cannot access another batch or student; submitted supervisor reviews cannot be edited.
- Admin restrictions work for every role-changing, deleting, reassignment, and report route.
