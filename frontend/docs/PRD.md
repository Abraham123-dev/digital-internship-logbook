# Logr – Product Requirements (Client Side)
Version 2.0 · Complete specification for design and AI-assisted build · pairs with Logr – Technical Requirements (Server Side)

## 1. Product summary

Logr (the agreed product name) is a web app that replaces the paper internship logbook for SWEP and SIWES students. Students write one logbook page per working day and must submit each week before a fixed Saturday deadline. School coordinators review and grade. SWEP students confirm attendance with a code the coordinator generates in class. SIWES students send their submitted weeks to their external workplace supervisor for review whenever they choose, who needs no account.

**How to use this document:** features F1 to F13 each list the screens, the step-by-step user flow, the rules and the exact messages. The Server Side document uses the same F1 to F13 numbering and says what the server does for every step. Together they carry the whole product, so either can be pasted into an AI prompt to generate screens, components or backend code.

### Golden rules

1. There is no daily deadline. There is only a weekly deadline: Saturday 11:59 p.m. Nigeria time, judged by the server clock.
2. A page that is not yet filled is never called "missed". It is shown as **Not filled yet** and can still be filled until the weekly deadline. Only a whole week can be missed.
3. A week can be submitted only when every working day of that week is filled. Submission is weekly; there is no daily or end-of-programme submission.
4. Future days cannot be opened. Today always shows a fresh blank page.
5. Submitted pages can be viewed but never changed (unless the coordinator returns the week or an extension is approved).
6. After the deadline an unsubmitted week locks. The student can ask the coordinator for an extension with an explanation.
7. SWEP: attendance only through a coordinator-generated code that expires in at most 3 minutes. SIWES: no attendance.
8. SIWES: an always-available Send to supervisor button gathers every submitted week that has not been sent yet and sends it to the external supervisor, who reviews and signs through an emailed link, without an account. Programme length does not matter.

---

## 2. Roles

| Role | Who | Can do |
|---|---|---|
| Student | Intern in SWEP or SIWES | Self-registers, writes pages, submits weeks, requests extensions, enters attendance code (SWEP), requests supervisor review (SIWES) |
| Coordinator | School staff for one department | Accepts invitation, sets cohort dates, reviews and grades, decides extensions, generates attendance codes (SWEP), sees supervisor reviews (SIWES) |
| Admin | System administrator | Seeded account; invites coordinators; manages students, coordinators, cohorts; reports; audit log |
| Supervisor | External workplace supervisor (SIWES) | No account; opens an emailed link to read the weeks sent to them and leave a review and signature |

---

## 3. SWEP and SIWES

The student chooses the programme at signup. Only an admin can change it later. The interface hides everything that does not apply.

| Feature | SWEP | SIWES |
|---|---|---|
| Where | On campus, compulsory | Outside school |
| Daily logbook page | Yes | Yes |
| Weekly deadline and extensions | Yes | Yes |
| Attendance code | Yes | Hidden |
| Coordinator grades pages | Yes | Yes |
| Supervisor review (sent on demand) | No | Yes |

---

## 4. Time model

All times are Nigeria time (Africa/Lagos). The app shows the server's time, never the phone's.

- A **working day** is Monday to Friday by default. The coordinator can change working days per cohort and mark holidays (non-working dates).
- A **week** runs Monday to Sunday. Week 1 may start mid-week, on the cohort start date.
- The **weekly deadline** is Saturday 11:59 p.m. of that week.
- A **review batch** (SIWES) is every submitted week that has not yet been sent to the supervisor. It has no fixed length, so programmes of 8, 10, 12 or 16 weeks, or any other length, all work.
- A page counts as **filled** when its Activities text has at least 20 characters.

---

## 5. Status vocabulary

| Item | Status | Label shown | Meaning |
|---|---|---|---|
| Day page | none | Not filled yet | No content saved; still fillable until the deadline |
| Day page | draft | Draft | Saved but week not submitted; editable |
| Day page | submitted | Submitted | Part of a submitted week; view only |
| Day page | reviewed | Reviewed | Coordinator rated it; view only |
| Day page | returned | Returned | Coordinator asked for corrections; editable |
| Day page | future | Opens \<day\> | Not openable yet |
| Week | open | In progress | Before the deadline, not submitted |
| Week | submitted | Submitted | Waiting for coordinator |
| Week | reviewed | Reviewed | Graded |
| Week | returned | Returned | Needs corrections before a correction deadline |
| Week | overdue | Overdue | Deadline passed, not submitted, extension possible |
| Week | missed | Missed week | Overdue and no extension possible or granted in time |
| Extension | pending / approved / denied / expired | Pending / Approved until \<date\> / Denied / Expired | Request state |
| Attendance | present / absent / excused | Present / Absent / Excused | SWEP daily result |
| Supervisor review batch | not sent / sent / reviewed / expired | Not sent / Awaiting supervisor / Reviewed / Link expired | SIWES supervisor review |
| Account | active / deactivated / withdrawn / rusticated | Active / Deactivated / Withdrawn / Rusticated | User status |

---

## 6. F1 Student signup and programme selection

**Screen:** `/signup` (Student signup)

### Flow

1. The student opens `/signup` from the login page link "New student? Create account".
2. Enters full name, matric number, email, department (dropdown), password.
3. Chooses the internship programme: two large selectable cards, SWEP (On campus, attendance code) and SIWES (Off campus, no attendance). One must be selected.
4. Taps Create account. The button shows a spinner and is disabled.
5. On success the student is signed in and lands on the student home.
6. If no cohort exists yet for the programme and department, the home shows "Waiting for your coordinator to set the programme dates."

### Rules

- **FR-F1.1** Only students can sign up. There is no coordinator or admin signup.
- **FR-F1.2** Matric number and email must be unique. Errors show under the field ("This matric number is already registered").
- **FR-F1.3** Password: at least 8 characters, strength hint shown while typing, show/hide toggle.
- **FR-F1.4** Programme is required and shown with its description. A hint says only an admin can change it later.
- **FR-F1.5** Validation runs on blur and on submit. The first invalid field gets focus.

---

## 7. F2 Login, session, password reset, profile

**Screens:** `/login`, `/forgot-password`, `/reset-password`, `/student/profile`, `/coordinator/profile`

### Flow

1. Student or coordinator enters email and password on `/login` and taps Sign in.
2. The app routes by role: student to `/student`, coordinator to `/coordinator`.
3. Forgot password: the user enters their email and taps Send reset link. The message is always "If that email exists, a reset link has been sent. It expires in 1 hour."
4. The reset page asks for a new password twice; on success it returns to `/login` with "Password updated".
5. Profile page shows name, email, matric number (read only), department, programme (read only), change-password form, and for SIWES students the saved supervisor details.
6. Sign out is in the profile menu and clears the session.

### Rules

- **FR-F2.1** Wrong credentials show "Email or password is incorrect" without saying which.
- **FR-F2.2** Withdrawn, rusticated or deactivated users see "This account is no longer active. Contact your coordinator." and cannot sign in.
- **FR-F2.3** After too many failed attempts the form shows "Too many attempts. Try again in a few minutes."
- **FR-F2.4** A session expiry returns the user to `/login` with the page they were on remembered.

---

## 8. F3 Admin sign-in

**Screen:** `/admin/login`, visually plainer, with a separate dashboard.

- **FR-F3.1** Admin enters email and password. Admin accounts are created only by the technical team; there is no signup link.
- **FR-F3.2** Non-admin credentials show the same error as wrong credentials.

---

## 9. F4 Coordinator invitation

**Screens:** `/admin/invitations`, `/accept-invite`

### Flow

1. Admin opens Invitations, enters the coordinator's email, picks a department, taps Send invitation.
2. The new invitation appears in the table as Pending.
3. The coordinator gets an email from Logr with an Accept invitation button.
4. The button opens `/accept-invite`. The email is shown locked. The coordinator enters full name, password and confirm password, then taps Create coordinator account.
5. On success the coordinator is signed in and lands on `/coordinator`.

### Rules

- **FR-F4.1** Invitation table columns: email, department, status (Pending, Accepted, Expired, Revoked), sent date, actions.
- **FR-F4.2** Pending invitations offer Resend and Revoke. Expired ones offer Resend.
- **FR-F4.3** Invitations expire after 72 hours.
- **FR-F4.4** An expired, used or revoked link shows "This invitation is no longer valid. Ask your admin to resend it."
- **FR-F4.5** The form blocks an email that already belongs to a user.

---

## 10. F5 Cohorts, start and end dates, holidays

**Screens:** `/coordinator/cohort` (create and edit), `/admin/cohorts`

### Flow

1. A new coordinator sees "Set up your cohort" on the dashboard.
2. The coordinator selects the programme (SWEP or SIWES), enters the session (for example 2025/2026), start date, end date, working days, holidays, and cohort settings: weekly deadline day and time (default Saturday 23:59), extension grace maximum (default 7 days), extension request window (default 14 days), correction period for returned weeks (default 2 days).
3. Taps Save cohort. Matching students join automatically.
4. Admin sees all cohorts in a table and can edit dates.

### Rules

- **FR-F5.1** Start date must be before end date and the cohort needs at least one working day.
- **FR-F5.2** After the first page exists the coordinator cannot change the start date; the end date can only move later. Admin can change both. The form explains why fields are locked.
- **FR-F5.3** Holidays are picked on a calendar. Adding a holiday removes that day from the working days of its week.
- **FR-F5.4** The student home shows "Week X of N" and "Day X of N" using these dates.

---

## 11. F6 Student home, week view and daily logbook page

**Screens:** `/student` (home and current week), `/student/day/[date]` (page editor or viewer), `/student/week/[n]` (any week)

### Student home layout

- **Header:** Logr mark, student name, programme chip (SWEP or SIWES), "Week 3 of 12 · Day 12 of 60".
- **Current week card:** one tile per working day (Monday to Friday by default), each showing day name, date and a status.
- **Week card footer:** deadline line ("Due Saturday 11:59 p.m. · 1 day left"), a progress line ("3 of 5 days filled") and the Submit week button (see F7).
- **Below:** Previous weeks list, each row with week number, date range and week status chip. SIWES students also see the always-available Send to supervisor button and their Supervisor reviews list (see F11).
- SWEP students see an Enter code button (see F9).

### Day tile states

| Situation | Tile shows | Tap does |
|---|---|---|
| Today, nothing saved | New page (blank page illustration, highlighted) | Opens a blank page for today |
| Earlier day this week, nothing saved | Not filled yet (neutral grey, never red) | Opens the blank page so it can still be filled |
| Saved, week not submitted | Draft (amber); a tick appears when the day is filled ("ready") | Opens the editor |
| Week submitted | Submitted (view only, lock icon) | Opens the read-only viewer |
| Coordinator rated it | Reviewed with the rating | Opens the viewer with rating and comment |
| Coordinator returned the week | Returned (orange) | Opens the editor with the coordinator's comment |
| Later day this week | Opens Wednesday (disabled) | Nothing |
| Week is overdue | Tiles show their last state with a lock | Opens the viewer; editing is disabled |

### Page editor flow

1. The student opens a day tile. A page opens titled with the full date ("Sunday, 18 October").
2. Fields in order: Activities done (required, multi-line, at least 20 characters to count as filled), Skills learned (optional), Photos (up to 5), My review of the day (the student's own reflection, at the bottom).
3. The page autosaves a few seconds after typing stops and shows "Saved" with a time. Save draft saves immediately.
4. Photos: tap + to pick an image; a thumbnail appears with a remove (x) button. Allowed: jpeg, png, webp, up to 5 MB each.
5. Leaving with unsaved changes shows "You have unsaved changes".
6. After a week is submitted the same page opens in viewer mode: text shown as read-only, photos tappable to enlarge, a banner "Submitted on \<date\>".

### Rules

- **FR-F6.1** Today always shows a fresh blank page; a new calendar day shows a new page automatically.
- **FR-F6.2** Any working day of the current week up to today can be opened and filled until the weekly deadline. Future days cannot be opened.
- **FR-F6.3** Pages of earlier weeks are viewable only, unless an approved extension reopened that week.
- **FR-F6.4** There is no per-day deadline and no per-day submission.
- **FR-F6.5** Non-working days (weekends, holidays) have no page; holidays show as "Holiday" tiles.
- **FR-F6.6** The editor never loses text: failed saves keep the text on screen and retry, with "Couldn't save. Retrying…".
- **FR-F6.7** The coordinator's comment on a returned page is shown at the top of the editor.

---

## 12. F7 Weekly submission and deadline

**Screen:** the week card on `/student` and the Submit week dialog

### Flow

1. The Submit week button stays disabled until every working day of the week is filled. The helper text names the gaps ("Fill Wednesday and Thursday to submit"). Because future days cannot be opened, the button can first be enabled on the last working day, once that page is filled.
2. The student taps Submit week. A dialog shows the five days with their first line, and warns "You can't edit this week after submitting."
3. The student taps Confirm and submit. The week becomes Submitted and all its pages become view only. A banner shows "Week 3 submitted on \<date and time\>".
4. If the coordinator returns the week, it reopens with a correction deadline ("Fix and resubmit by Tuesday 11:59 p.m.") and the student resubmits the same way.

### If the deadline passes

1. At Saturday 11:59 p.m. an unsubmitted week becomes Overdue. The card turns red, editing and submitting are disabled, and a Request extension button appears (see F8).
2. If no extension is possible or none is granted in time, the week becomes Missed week.

### Rules

- **FR-F7.1** The countdown on the week card uses the server's time and updates every minute; in the last hour it shows minutes.
- **FR-F7.2** Reminders: Friday afternoon and Saturday evening, if the week is not submitted (see F13).
- **FR-F7.3** A late but approved submission shows a Late (approved) tag to the coordinator.
- **FR-F7.4** If the submit request arrives after the deadline, the dialog shows "The deadline has passed. Request an extension." and refreshes the week card.
- **FR-F7.5** Missed weeks are visible in the student's history and in coordinator and admin reports.

---

## 13. F8 Extension requests

**Screens:** Request extension sheet (student), `/coordinator/extensions` (list and decision)

### Student flow

1. On an overdue week the student taps Request extension.
2. A sheet asks for the reason (required, at least 20 characters) and an optional attachment (pdf, jpeg or png, up to 5 MB), for example a medical note.
3. The student taps Send request. The week card shows Extension pending.
4. When the coordinator decides, the student gets an email and an in-app notice.
5. Approved: the week reopens; the card shows "Extended until Wednesday 11:59 p.m.". The student fills any unfilled days and submits as normal.
6. Denied: the card shows the coordinator's comment; the week stays locked.
7. If the extended time runs out unsubmitted the week locks again and shows "Extension expired".

### Coordinator flow

1. The coordinator opens Extension requests: a list with student matric number, week, reason, attachment link and time since the deadline.
2. Opens a request and picks Approve (choose grace days from 1 to the cohort maximum, default 3) or Deny (comment required).
3. A confirmation shows the exact new deadline before approving.

### Rules

- **FR-F8.1** One open request per week. A new request can only be sent within the request window (default 14 days after the deadline).
- **FR-F8.2** A week can receive one approved extension by default (setting).
- **FR-F8.3** The student cannot edit the reason after sending.
- **FR-F8.4** Requests are not available for submitted weeks.

---

## 14. F9 SWEP attendance code

Visible to SWEP students and coordinators only. SIWES users never see it.

### Coordinator flow (screen: `/coordinator/attendance`, also a panel on the dashboard)

1. During or after class the coordinator chooses the moment (it can be unannounced) and taps Generate code.
2. A large six-character code appears with a countdown timer (up to 3 minutes; the coordinator may choose 1, 2 or 3 minutes, default 3), a live count ("14 of 32 present") and an End now button.
3. The coordinator announces the code in class.
4. When the timer ends (or End now is tapped) the code disappears and the session closes. The panel shows the final list: Present, and not yet present.
5. The coordinator may generate a new code later in the day if needed (up to 3 per day). A new code replaces the old one. Students already marked Present stay Present.
6. Override: the coordinator can mark a student Present or Excused with a required reason.

### Student flow

1. The Enter code button is shown on the student home and on each SWEP page.
2. Tapping it opens a sheet with six code boxes and a Submit button. There is no timer on the student side.
3. If the code is right and still active: success screen "Attendance recorded. You're present today." and the button changes to "Present today".
4. If the code is wrong or expired: "That code isn't valid or has expired." If no code is active: "Attendance isn't open right now." The student cannot see when a code will appear.
5. After repeated wrong entries: "Too many attempts. Wait a few minutes."
6. The student has an Attendance history list (date, Present, Absent or Excused) and a summary ("11 of 12 days").

### Rules

- **FR-F9.1** The code exists only on the coordinator's screen. It is never sent to student devices.
- **FR-F9.2** A student can be marked present once per day.
- **FR-F9.3** A SWEP day on which the coordinator generated no code has no attendance record; nobody is marked Absent for it.
- **FR-F9.4** A SWEP day on which a code was generated and the student never entered a valid one is shown as Absent after the day ends.
- **FR-F9.5** Coordinator counter shows the live count without reloading.

---

## 15. F10 Coordinator workspace: students, review and grading

**Screens:** `/coordinator` (dashboard), `/coordinator/students`, `/coordinator/students/[id]`, `/coordinator/review/[weekId]`

### Dashboard

Attendance panel (SWEP), tiles for "Weeks waiting for review", "Extension requests", "Overdue weeks", "Supervisor details received".

### Student cards

1. The students screen shows one yellow logbook cover card per student with the matric number, a progress bar (weeks submitted of total), and badges ("2 to review", "Overdue", "Extension requested").
2. Filters: To review, Overdue, Extension requested, All. Search by matric number.

### Review flow

1. The coordinator taps a card; the student's weeks are listed with status chips.
2. Opening a submitted week shows its pages; the coordinator swipes or taps arrows through them (entry, photos, student's own review).
3. For each page the coordinator picks a rating of 1 to 5 and may add a comment.
4. When all pages are rated the coordinator taps Finish review; the week becomes Reviewed.
5. Return week: requires a comment; the week reopens for the student with a correction deadline.
6. The card footer shows the running average as a percentage (average out of 5, times 20) and the number of reviewed weeks.
7. SIWES students: the same screen also shows each supervisor review batch, signature and supervisor contact details.

### Rules

- **FR-F10.1** Coordinators see only students of their own department and cohort.
- **FR-F10.2** A rating can be changed until the week is finished; after that, only by returning or admin action.
- **FR-F10.3** The final score for a student is the average of all rated pages converted to a percentage, shown after the programme ends and live as a running figure.
- **FR-F10.4** Missed weeks are listed on the student's card. How they affect the final percentage is an open question (section 22).
- **FR-F10.5** Late (approved) weeks carry a tag.

---

## 16. F11 SIWES supervisor review (send anytime)

**Student screens:** the always-visible Send to supervisor button on `/student`, the send sheet, and `/student/reviews`

### Student flow

1. The Send to supervisor button is always visible on the student home (SIWES only) and is never disabled.
2. The student taps it. A sheet shows what will be sent: the submitted weeks that have not been sent before, picked automatically. Weeks that were not submitted are not included.
3. The sheet asks for the supervisor's name, email and phone number (organisation optional). After the first time the saved details are prefilled and can be edited.
4. The student taps Send. The system records exactly which weeks were sent, saves the supervisor details, sends them to the school coordinator for the student's department, and emails the supervisor.
5. A new supervisor review card appears showing the weeks covered, the date sent and Awaiting supervisor, with a Resend option (once every 24 hours).
6. Tapping Send to supervisor again later gathers only the weeks submitted since the last send and sends them as a new batch.
7. If nothing new has been submitted since the last send, the sheet says "Everything you've submitted has already been sent to your supervisor." and nothing is sent.
8. When the supervisor finishes a batch, its card shows Reviewed, the supervisor's name, the review text and the signature.
9. A link that expires unused shows Link expired and Resend; the weeks stay in that batch.

### Coordinator flow

Gets an email and an in-app notice with name, email and phone; sees the weeks covered and the review status of each batch on the student's card.

### Supervisor flow (screens: `/supervisor/review`, `/supervisor/done`; no account, no login)

1. The supervisor receives an email from Logr naming the student and the weeks covered, with a Leave review button.
2. The button opens a standalone page showing the student's name, matric number, programme, company and the weeks covered.
3. The page lists each week in the batch. Each week expands to the daily entries and uploaded photos, read-only.
4. At the bottom: Review text box (required) and Signature. The supervisor can draw a signature with finger or mouse, or type their name and tick "I confirm this is my signature".
5. Submit review shows a confirmation, then a thank-you page.
6. A used or expired link shows "This link is no longer valid" with Request a new link.

### Rules

- **FR-F11.1** SIWES only; SWEP students never see Send to supervisor.
- **FR-F11.2** Weeks sent for review become view only for the student (extensions excepted).
- **FR-F11.3** The supervisor page works on a phone with no installation and no menu.
- **FR-F11.4** The review is final once submitted.
- **FR-F11.5** The link is valid for 14 days.

---

## 17. F12 Admin management

**Screens:** `/admin` (overview), `/admin/students`, `/admin/coordinators`, `/admin/invitations`, `/admin/cohorts`, `/admin/reports`, `/admin/audit`

- **Overview:** counts for students, coordinators, pending invitations, weeks submitted this week, overdue weeks.
- **Students:** searchable table. Row actions: view, Change coordinator, Remove.
- **Remove student:** a dialog asks the reason and a required note, then a red confirm. The student can no longer sign in and the records are kept.
- **Coordinators:** table with student counts. Remove only after reassigning all students.
- **Reports:** submission rate by department, weeks missed, extension counts, average attendance, average logbook score, pending reviews; export as CSV.
- **Audit log:** time, actor, action, target; filterable.

### Rules

- **FR-F12.1** Every destructive action needs a confirmation.
- **FR-F12.2** Only admin can change a student's programme.
- **FR-F12.3** Admin sees but cannot edit student page content.

---

## 18. F13 Notifications

An in-app notification list (bell icon) and email.

| Trigger | Recipient | Channel |
|---|---|---|
| Invitation sent | Coordinator | Email |
| Friday afternoon, week unsubmitted | Student | Email and in-app |
| Saturday evening, week unsubmitted | Student | Email and in-app |
| Deadline passed, week locked | Student | In-app |
| Week submitted | Coordinator | In-app |
| Extension requested | Coordinator | Email and in-app |
| Extension approved or denied | Student | Email and in-app |
| Week returned | Student | Email and in-app |
| Week reviewed | Student | In-app |
| Supervisor details received | Coordinator | Email and in-app |
| Review request | Supervisor | Email |
| Supervisor review submitted | Student and coordinator | Email and in-app |
| Password reset | Any user | Email |

---

## 19. Screen and route inventory

| Area | Route | Screen |
|---|---|---|
| Public | `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/accept-invite` | Signup, login, password reset, accept invitation |
| Student | `/student`, `/student/day/[date]`, `/student/week/[n]`, `/student/reviews`, `/student/attendance`, `/student/profile` | Home with week card, page editor and viewer, week view, supervisor review list, attendance history, profile |
| Coordinator | `/coordinator`, `/coordinator/students`, `/coordinator/students/[id]`, `/coordinator/review/[weekId]`, `/coordinator/extensions`, `/coordinator/attendance`, `/coordinator/cohort`, `/coordinator/profile` | Dashboard, student cards, one student, review, extension requests, attendance, cohort setup, profile |
| Admin | `/admin/login`, `/admin`, `/admin/students`, `/admin/coordinators`, `/admin/invitations`, `/admin/cohorts`, `/admin/reports`, `/admin/audit` | Admin screens |
| Supervisor | `/supervisor/review`, `/supervisor/done` | Review page and thank-you |

---

## 20. Client-side quality requirements

- **Mobile first:** works from 360 px width; touch targets at least 44 px. Admin screens are desktop-first but responsive.
- **Visual identity:** logbook yellow (`#F5B800`), deep navy (`#14213D`), warm off-white background; clean rounded cards; the student's cover looks like a yellow logbook.
- Every list has loading, empty and error states.
- **Accessible:** labelled inputs, contrast at least WCAG AA, status never shown by colour alone.
- Photos load as thumbnails first; the supervisor page must work on slow connections.
- **Frontend stack:** Next.js, Tailwind, Shadcn UI, TanStack Query.

---

## 21. Out of scope for this version

Supervisor accounts, native mobile apps, payments, offline writing, in-app chat.

---

## 22. Assumptions and open questions

- **Assumption:** a page is filled when Activities has at least 20 characters; the student's own review is optional.
- **Assumption:** the coordinator is notified of supervisor details but does not approve them before the email goes out.
- **Assumption:** up to 3 attendance codes per day, one active at a time.
- **Open:** how do Missed weeks count in the final percentage (excluded, or counted as zero)?
- **Open:** does the supervisor review carry a numeric score?
- **Open:** can a denied extension be appealed once?
- **Open:** is a printable PDF logbook with signatures needed?
- **Open:** is email verification needed at student signup?
