# Logr backend

Django REST Framework backend for the OAU digital internship logbook. This document covers the authentication MVP only.

## What authentication includes

- Student signup, institutional email-domain validation, and email OTP verification.
- Student and coordinator email/password login.
- Admin login through Django superuser accounts.
- JWT access tokens and rotating refresh tokens in an HTTP-only cookie.
- Admin-created coordinator invitations, accepted through a one-time link.
- Forgot/reset password, change password, and current-user endpoint.
- One shared custom `LogrAccount`, with separate `StudentProfile` and `CoordinatorProfile` models.

The project uses a small custom `LogrAccount` model with email as its login field. Student-specific email-domain validation lives in `SignupSerializer`. Student and coordinator details live in their profile models. `Department` is a small shared table containing department names so student profiles, coordinator profiles, and invitations refer to the same department.

## Setup

Install dependencies and configure a private `.env` file. Do not commit `.env`, `credentials.json`, or OAuth tokens.

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

| Environment variable | Purpose |
|---|---|
| `SECRET_KEY` | Django signing key |
| `STUDENT_EMAIL_DOMAINS` | Comma-separated exact domains allowed for student signup; for example `students.example.edu,oauife.edu.ng`. Set the actual approved domain before using signup. |
| `FRONTEND_URL` | Frontend base URL for invitation and password-reset links |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` | OAuth credentials for the shared sender mailbox |
| `GMAIL_REFRESH_TOKEN` | Refresh token from the one-time sender authorization |
| `GMAIL_SENDER_EMAIL` | Shared Gmail sender address (`GMAIL_FROM_EMAIL` is also accepted) |
| `DATABASE_URL` | Optional PostgreSQL URL; otherwise SQLite is used |
| `CACHE_BACKEND` | Set to `database` to use Django's database cache; otherwise local-memory cache is used |
| `ALLOWED_HOSTS` | Comma-separated Django host names |

### Gmail sender setup

Enable Gmail API and create a Google OAuth **Desktop app** client. Save its downloaded credentials as the ignored `credentials.json` in the project root, then authorize the shared sender once:

```powershell
python scripts/authorize_gmail_sender.py
```

The script uses `google-auth-oauthlib` and requests only `gmail.send`. Copy its refresh token and the same client's ID and secret into the environment. The deployed app uses those values with Gmail API; it does not launch a consent flow. All OTP, invitation, and password-reset emails use Gmail. Resend.com is not used; “resend OTP” means email a replacement code through Gmail.

Google OAuth refresh tokens can expire after seven days while an external consent screen is in Testing mode. Configure the sender's consent screen for deployment before relying on it in production.

Apply migrations and create the first admin:

```powershell
python manage.py migrate
python manage.py createsuperuser
```

When prompted, enter the admin's email address; it is the login identifier. Add departments in Django admin at `/admin/` before student signup or coordinator invitations.

If deploying multiple workers, use a shared cache:

```powershell
# Set CACHE_BACKEND=database in .env, then:
python manage.py createcachetable
```

`LocMemCache` is per process and intended for local development. Configure HTTPS, `DEBUG=False`, `ALLOWED_HOSTS`, CORS, CSRF trusted origins, and cookie settings for deployment. Browser clients should call `GET /api/v1/auth/csrf/`, send cookies with requests, and include the `csrftoken` value as `X-CSRFToken` on login, refresh, and logout. For a cross-site frontend/API deployment, use HTTPS and set both refresh and CSRF cookie SameSite values to `None`.

## API conventions

All routes use the `/api/v1` prefix and trailing slashes. Protected routes accept `Authorization: Bearer <access-token>`. Responses do not include the refresh token in JSON; it is set in the HTTP-only `refresh_token` cookie scoped to `/api/v1/auth/`.

Access tokens last 15 minutes. Refresh tokens last seven days, rotate on refresh, and are blacklisted on rotation and logout. Successful responses include `server_time` where applicable.

Serializer validation errors use DRF's normal field format, for example:

```json
{
  "email": ["Use an approved student email domain."]
}
```

Flow errors use `{ "code": "...", "message": "..." }`.

## Student signup and OTP

### `POST /api/v1/auth/student/signup/`

Request:

```json
{
  "first_name": "A",
  "last_name": "Student",
  "matric_no": "CSC/2023/001",
  "email": "student@students.example.edu",
  "department_id": 1,
  "programme": "SIWES",
  "password": "a-strong-example-password"
}
```

Creates an inactive account and keeps the student profile details in Django cache while the email is unverified. It then emails a six-digit OTP. The profile is created only after successful OTP verification. Email domain matching is case-insensitive and exact; subdomains are not automatically allowed. Passwords use Django's validators. Success (`201`):

```json
{ "server_time": "...", "message": "Verification code sent." }
```

Common errors: field validation, duplicate email/matric number (`409`), or `email_delivery_failed` (`503`). If Gmail is unavailable, the pending account remains and can request another code.

### `POST /api/v1/auth/student/verify-otp/`

Request: `{ "email": "student@students.example.edu", "otp": "123456" }`.

Stores the OTP in Django cache for ten minutes. A correct code creates the student profile, marks its email verified, and activates the account. Success: `{ "message": "Email verified. Your student profile has been created." }`. Wrong, missing, or expired codes return `otp_invalid_or_expired`.

### `POST /api/v1/auth/student/resend-otp/`

Request: `{ "email": "student@students.example.edu" }`. Sends a replacement code through Gmail if a pending signup is cached. Pending signup details are kept for up to 24 hours; each OTP expires after ten minutes. Returns a generic success message for unknown, expired, or already verified signups. Email delivery failures return `email_delivery_failed` (`503`). DRF limits anonymous requests to 30 per hour per IP.

## Login and tokens

### `POST /api/v1/auth/login/`

Request: `{ "email": "student@students.example.edu", "password": "..." }`.

Success returns the user, profile, and access token; sets the refresh cookie:

```json
{
  "server_time": "...",
  "user": {
    "id": 12,
    "email": "student@students.example.edu",
    "full_name": "A Student",
    "role": "STUDENT",
    "profile": {
      "matric_no": "CSC/2023/001",
      "department": { "id": 1, "name": "Computer Science" },
      "programme": "SIWES",
      "cohort": null
    }
  },
  "access": "<access-token>"
}
```

Coordinators use the same endpoint; their profile contains their department. Errors include `invalid_credentials`, `email_not_verified`, and `account_type_invalid`.

### `POST /api/v1/auth/admin/login/`

Same request and response as login, but only Django superusers can sign in. Other users get `invalid_credentials`.

### `GET /api/v1/auth/csrf/`

Sets the CSRF cookie for browser clients. Response: `{ "server_time": "...", "detail": "CSRF cookie set." }`.

### `POST /api/v1/auth/refresh/`

Reads the refresh cookie, blacklists it, sets its replacement, and returns `{ "server_time": "...", "access": "<new-access-token>" }`. Missing, expired, or blacklisted cookies return `refresh_token_invalid` (`401`).

### `POST /api/v1/auth/logout/`

Blacklists the refresh cookie if present and clears it. Returns `{ "server_time": "...", "message": "Signed out." }`.

## Coordinator invitations

Invitation management requires a superuser. Invitations expire after 72 hours.

### `POST /api/v1/admin/invitations/`

Request: `{ "email": "coordinator@example.edu", "department_id": 1 }`. Creates an invitation and emails its link through Gmail. Success (`201`): `{ "server_time": "...", "id": 4, "status": "PENDING" }`. Errors include email validation, an existing account, `permission_denied`, and `email_delivery_failed` (`503`).

### `GET /api/v1/admin/invitations/`

Returns the latest 100 invitations with email, department, status, and expiry. Expired pending invitations are displayed as `EXPIRED`.

### `POST /api/v1/admin/invitations/{id}/resend/`

Replaces the token, extends expiry by 72 hours, and emails a new link. Returns `{ "server_time": "...", "message": "Invitation resent." }`.

### `DELETE /api/v1/admin/invitations/{id}/`

Marks a pending invitation `REVOKED`. Returns `{ "server_time": "...", "message": "Invitation revoked." }`.

### `GET /api/v1/invitations/validate/?token=<token>`

Public. Returns the invitation email, department, and expiry if the link is valid. Otherwise returns `invitation_invalid`.

### `POST /api/v1/invitations/accept/`

Request: `{ "token": "<invitation-token>", "first_name": "A", "last_name": "Coordinator", "password": "a-strong-example-password" }`. The backend takes email and department from the invitation, creates the account/profile, marks the invitation accepted, and returns the user and tokens like login.

## Password and current-user endpoints

### `POST /api/v1/auth/forgot-password/`

Request: `{ "email": "user@example.edu" }`. Always returns the same `200` message whether or not the account exists. Eligible users receive a one-hour reset link using Django's built-in password-reset token generator.

### `POST /api/v1/auth/reset-password/`

Request: `{ "email": "user@example.edu", "token": "<token-from-email>", "password": "a-new-strong-password" }`. Success: `{ "server_time": "...", "message": "Password reset. Sign in again." }`. Invalid or expired links return `reset_token_invalid`.

### `GET /api/v1/me/`

Requires an access token. Returns the signed-in user's role and profile.

### `PATCH /api/v1/me/password/`

Request: `{ "current_password": "...", "new_password": "..." }`. Requires an access token. Checks the current password, changes it, and signs out existing refresh sessions.

## Simplified implementation notes

- The app uses a small custom `LogrAccount` with email as the login field. It uses Django's `AbstractBaseUser` only for password handling; it does not use `PermissionsMixin` or a custom permission system. Student and coordinator data live in two small profile models.
- OTP is generated with Python's `secrets` module and stored as a six-digit string in Django cache. Cache TTL gives it a ten-minute lifetime; verification compares the submitted code directly. No OTP hash or separate OTP model is used.

## Cohorts, attendance, logbook review, and admin

These endpoints are implemented in `backend/management/urls.py` and use `/api/v1/`. Protected routes require the JSON Bearer access token. Coordinators create cohorts; eligible students are attached automatically using department and programme. SWEP students use short-lived attendance codes. Coordinators grade entries; SIWES supervisor reviews use one-use email-link tokens and contain no numeric score.

| Feature | Main routes |
| --- | --- |
| Cohorts | `POST /coordinator/cohorts/`, `PATCH /coordinator/cohorts/{id}/`, `GET /cohorts/current/`, `GET/PATCH /admin/cohorts/` |
| Attendance | `POST /coordinator/attendance/sessions/`, `GET /coordinator/attendance/sessions/current/`, `POST /student/attendance/`, `GET /student/attendance/history/` |
| Student logbook | `GET /student/logbook/`, `GET/POST /student/logbook/weeks/{week_no}/`, `POST /student/logbook/weeks/{week_no}/extension-request/`, `GET/PUT /student/logbook/days/{date}/`, `POST /student/logbook/days/{date}/photos/` |
| Coordinator review | `GET /coordinator/dashboard/`, `GET /coordinator/students/`, `GET /coordinator/weeks/{id}/`, `PUT /coordinator/entries/{id}/review/`, `POST /coordinator/weeks/{id}/finish/` or `/return/` |
| Supervisor review | `GET/POST /student/supervisor-reviews/`, `GET/POST /supervisor/review/` with `X-Supervisor-Token` |
| Admin | `GET /admin/overview/`, `GET /admin/users/`, `PATCH /admin/users/{id}/status/`, `POST /admin/coordinators/{id}/reassign/`, `GET /admin/reports/`, `GET /admin/audit-logs/` |

Responses and request bodies for all management routes, status values, multipart photo upload, and common error codes are in [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md#cohorts-attendance-logbook-review-and-admin). Cloudinary media needs `CLOUDINARY_URL` set on the server. Install dependencies with `pip install -r requirements.txt`, then apply the auth and management migrations using `python manage.py migrate`.

### Scheduled deadline reminders

The `send_deadline_reminders` Django management command sends one reminder when an open logbook week is due in about 24 hours. Run it every five minutes so it can find the reminder window and retry temporary Gmail failures. It records the deadline already reminded for, so repeated scheduler runs do not send duplicates. If a coordinator approves a new extension deadline, the student can receive a reminder for that updated deadline as well.

For the exact Render environment variables, migration steps, Cron Job settings, and verification commands, follow [DEPLOYMENT_TO_DO.md](DEPLOYMENT_TO_DO.md).

On Windows Task Scheduler, create a task that repeats every five minutes. Set **Program/script** to the project's virtual-environment Python executable, **Add arguments** to `manage.py send_deadline_reminders`, and **Start in** to the project folder. On a Linux host with cron, use:

```cron
*/5 * * * * cd /path/to/digital-internship-logbook && /path/to/venv/bin/python manage.py send_deadline_reminders
```

The scheduler runs the command; no Celery worker or Redis service is needed. Keep it enabled on only one scheduler instance to avoid simultaneous runs.
- Password reset uses Django's `default_token_generator`; there is no password-reset-token model.
- Coordinator invitation tokens are random and single use, with a 72-hour expiry. The raw token is stored on the invitation row for straightforward lookup. Anyone with database read access could use a still-pending invitation; storing only a hash would reduce that risk but add another step to teach and maintain.
- Passwords are saved through Django's `create_user()` and `set_password()`, using Django's default PBKDF2 hasher. No Argon2 or Resend.com is used.
- Local-memory cache is simple for development. Use the shared database cache for deployments with more than one worker.
