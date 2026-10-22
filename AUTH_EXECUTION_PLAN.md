# Logr authentication execution plan

This is the simple implementation plan for the authentication MVP. The API and data model are documented in more detail in `README.md`.

## Scope

- Student signup with institutional email-domain validation.
- Email OTP verification and resend through the shared Gmail sender.
- Student/coordinator login, admin login, JWT refresh and logout.
- Admin-created coordinator invitations and link acceptance.
- Forgot/reset password, password change, and current-user endpoint.
- Django superuser setup.

## Keep the Django setup familiar

- Use a small custom `LogrAccount` model with email as the login field and a minimal manager for account and superuser creation. Use `AbstractBaseUser` for Django password handling; avoid `PermissionsMixin` and custom permission systems.
- Keep student-only fields in `StudentProfile` and coordinator department in `CoordinatorProfile`.
- Use a small `Department` table so signup profiles and invitations select the same department.
- Save passwords with Django's `create_user()` and `set_password()` so its default PBKDF2 hasher is used.
- Keep views as straightforward DRF API views and use serializers for request validation.

## Student signup and OTP

1. The signup serializer checks required fields, password validation, matric uniqueness, and that the email domain exactly matches one configured in `STUDENT_EMAIL_DOMAINS`.
2. Create a `LogrAccount` with the email as its login identifier, initially inactive. Keep the student profile details in Django cache; do not create `StudentProfile` yet.
3. Generate a six-digit code with Python's `secrets` module, save it in Django cache for ten minutes, and email it through the Gmail sender. Keep pending profile details in cache for up to 24 hours so a new code can be requested after an OTP expires.
4. Verification compares the submitted code with the cached code. On a match, create the `StudentProfile`, activate the account, and remove both cache entries.
5. Resend looks up the pending signup in cache, replaces its OTP, and emails the new code. Keep DRF's basic anonymous request throttle. There is no separate OTP model or OTP hashing step.

## Login and sessions

- Authenticate with the normalized email as the account's `USERNAME_FIELD`.
- Allow students only after OTP verification; coordinators must have a coordinator profile.
- Permit only superuser accounts at the admin login route.
- Return the access JWT in JSON and set the seven-day rotating refresh JWT in an HTTP-only cookie.
- Refresh rotates and blacklists the old token. Logout blacklists the cookie token and clears the cookie.
- Password reset uses Django's `default_token_generator` with a one-hour timeout. No reset-token table is needed.

## Coordinator invitations

1. A superuser creates an invitation with an email, department, random single-use token, and 72-hour expiry.
2. Gmail sends the acceptance link. The public validate endpoint returns the locked email and department.
3. Acceptance uses the invitation email and department to create the `LogrAccount` and coordinator profile, then marks the invitation accepted.
4. Admins can resend or revoke pending invitations.

For this teaching MVP, the raw random invitation token is stored on the invitation row to make lookup easy to follow. Anyone with read access to the database could use a still-valid invitation. A later security pass can store only its digest.

## Gmail sender

- Use a shared sender mailbox and Gmail API.
- Create a Desktop OAuth client and run `scripts/authorize_gmail_sender.py` once locally.
- Put the refresh token, client ID, client secret, and sender address in private environment variables.
- Use `google-auth` and `google-api-python-client` from Django. The deployed app does not start OAuth consent.
- Send OTPs, invitation links, and password-reset links through Gmail. Do not use Resend.com or Celery.

## MVP infrastructure

- Use Django cache for OTP expiry. Local memory is fine for development; select Django's database cache when requests may reach multiple workers.
- Keep Django's default password hasher. Do not add Argon2.
- Do not add Redis or a background job system for authentication.
- Keep email sending synchronous with bounded HTTP timeouts.

## Endpoints

All paths are under `/api/v1/`:

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/student/signup/` | Create pending student account and send OTP |
| POST | `/auth/student/verify-otp/` | Verify email and activate student |
| POST | `/auth/student/resend-otp/` | Send replacement OTP |
| POST | `/auth/login/` | Student/coordinator login |
| POST | `/auth/admin/login/` | Superuser login |
| POST | `/auth/refresh/` | Rotate refresh cookie |
| POST | `/auth/logout/` | Blacklist refresh cookie |
| POST | `/auth/forgot-password/` | Email reset link, with generic response |
| POST | `/auth/reset-password/` | Validate reset token and set password |
| GET | `/me/` | Return current user and profile |
| PATCH | `/me/password/` | Change password |
| POST, GET | `/admin/invitations/` | Create/list invitations (superuser) |
| POST | `/admin/invitations/{id}/resend/` | Replace invitation token and send new link |
| DELETE | `/admin/invitations/{id}/` | Revoke invitation |
| GET | `/invitations/validate/?token=...` | Validate public invitation link |
| POST | `/invitations/accept/` | Create coordinator account from invitation |

## Setup decisions needed before deployment

- Set the approved student email domain in `STUDENT_EMAIL_DOMAINS`.
- Add department rows in Django admin.
- Configure `FRONTEND_URL`, Gmail OAuth credentials, `ALLOWED_HOSTS`, CORS, CSRF, HTTPS, and cookie SameSite settings.
- Run migrations before creating accounts; create the admin with `python manage.py createsuperuser` and an email address.

## Source requirements

The server specification is `Digital Logbook – Technical Requirements (Server Side).pdf`. This MVP plan keeps its authentication endpoints and 15-minute access / seven-day refresh behavior, while simplifying storage and delivery: Django cache instead of Redis, synchronous Gmail instead of Celery, built-in password hashing instead of Argon2, and student OTP verification before login.
