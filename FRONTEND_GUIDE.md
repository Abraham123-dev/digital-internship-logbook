# Frontend Integration Guide

This guide describes the authentication API as it is currently routed in `backend/auth/urls.py`. Every endpoint is under `/api/v1/` and uses JSON request/response bodies unless stated otherwise. Use the full URL as `<API_BASE_URL>/api/v1/...` and include the trailing slash.

## Requests, tokens, and errors

- Send `Content-Type: application/json` for JSON requests.
- Protected endpoints require `Authorization: Bearer <access>`.
- Login and invitation acceptance return `access` and `refresh` tokens in JSON. Keep the refresh token available to the client so it can be sent to refresh and logout. These endpoints do not set a cookie.
- When an access token expires, send the refresh token to `POST /auth/refresh/`. Save both replacement tokens from the response; the old refresh token is blacklisted after rotation.
- Authentication/flow errors generally look like `{ "code": "...", "message": "..." }`. Serializer validation errors use DRF's field format, such as `{ "email": ["Enter a valid email address."] }`. Some existing endpoints use `{ "error": "..." }` or `{ "message": "..." }` instead; see endpoint details below.
- OTPs expire after 10 minutes. Student signup details remain pending for up to 24 hours. Coordinator invitation links expire after 72 hours.

## Student signup and verification

### `POST /auth/student/signup/`

```json
{
  "first_name": "Ada",
  "last_name": "Student",
  "matric_no": "CSC/2023/001",
  "email": "ada@students.example.edu",
  "department_id": 1,
  "programme": "SIWES",
  "password": "a-strong-password"
}
```

`department_id` must be an existing department ID. `programme` is `SWEP` or `SIWES`. The email domain must exactly match one of the configured `STUDENT_EMAIL_DOMAINS`; the frontend should not hardcode this list. On success (`201`):

```json
{ "message": "Verification code sent.", "email": "ada@students.example.edu" }
```

The frontend should then show the OTP form. Signup does not return tokens; the student must verify the email and then sign in.

### `POST /auth/student/verify-otp/`

```json
{ "email": "ada@students.example.edu", "otp": "012345" }
```

Keep `otp` as a string so leading zeroes are preserved. Success (`200`):

```json
{ "message": "Email verified. Your student profile has been created." }
```

Invalid or expired code returns `otp_invalid_or_expired` (`400`). If pending signup data has expired, the response is `signup_expired` (`400`); ask the student to sign up again.

### `POST /auth/student/resend-otp/`

```json
{ "email": "ada@students.example.edu" }
```

Success (`200`) is deliberately generic, even if no pending signup exists:

```json
{ "server_time": "...", "message": "If verification is needed, a code has been sent." }
```

Email delivery failure returns `email_delivery_failed` (`503`).

## Sign in and token lifecycle

### `POST /auth/login/`

Students and coordinators use the same endpoint:

```json
{ "email": "ada@students.example.edu", "password": "a-strong-password" }
```

Success (`200`):

```json
{
  "message": "Login successful",
  "username": "Ada",
  "refresh": "<refresh-token>",
  "access": "<access-token>"
}
```

Store both tokens. Send the access token as a Bearer token on protected requests. Errors include `invalid_credentials` (`401`), `email_not_verified` (`403`), and `account_type_invalid` (`403`).

### `POST /auth/admin/login/`

Uses the same `{ "email", "password" }` request and returns the same token response. Only a Django superuser can use this endpoint; other accounts receive `invalid_credentials` (`401`).

### `POST /auth/refresh/`

No access token is required. Send the current refresh token in JSON:

```json
{ "refresh": "<current-refresh-token>" }
```

Success (`200`):

```json
{
  "server_time": "...",
  "access": "<new-access-token>",
  "refresh": "<new-refresh-token>"
}
```

Replace both stored tokens. Missing, invalid, expired, or already-rotated refresh tokens return `refresh_token_invalid` (`401`). Inactive accounts return `account_deactivated` (`403`).

### `POST /auth/logout/`

Requires a valid access token and the current refresh token in JSON:

```json
{ "refresh": "<current-refresh-token>" }
```

Success (`200`): `{ "message": "Signed out." }`. Clear both tokens client-side after success. Missing refresh token returns `{ "error": "Refresh token is required" }` (`400`); invalid token returns `{ "error": "Invalid or expired token" }` (`400`).

## Coordinator invitation flow

The admin must first create an invitation. The coordinator opens the emailed link, whose token should be read from the `token` query parameter, and the frontend validates it before showing the account form. The invitation email is returned by validation and should be displayed read-only; the accept form does not submit an email or department.

### `POST /admin/invitations/` (admin)

Requires a superuser access token. Request:

```json
{ "email": "coordinator@example.edu", "department_id": 1, "programme": "SIWES" }
```

Success (`201`): `{ "server_time": "...", "id": 4, "status": "PENDING" }`. The API sends the invitation email. Errors include `permission_denied` (`403`) and `email_delivery_failed` (`503`).

### `GET /admin/invitations/` (admin)

Requires a superuser access token. Returns the latest invitations:

```json
{
  "server_time": "...",
  "results": [
    {
      "id": 4,
      "email": "coordinator@example.edu",
      "department": "Computer Science",
      "programme": "SIWES",
      "status": "PENDING",
      "expires_at": "..."
    }
  ]
}
```

Expired pending invitations are presented with status `EXPIRED`.

### `POST /admin/invitations/{id}/resend/` and `DELETE /admin/invitations/{id}/`

Both require a superuser access token. Resend has no request body; it replaces the token and sends a new link. Success: `{ "server_time": "...", "message": "Invitation resent." }`. Delete has no request body and revokes a pending invitation. Success: `{ "server_time": "...", "message": "Invitation revoked." }`.

### `GET /invitations/validate/?token=<invitation-token>`

Public. Success (`200`):

```json
{
  "server_time": "...",
  "email": "coordinator@example.edu",
  "department": "Computer Science",
  "programme": "SIWES",
  "expires_at": "..."
}
```

Invalid, expired, revoked, or already accepted links return `invitation_invalid` (`400`).

### `POST /invitations/accept/`

Public. Submit the token from the link and coordinator-entered fields:

```json
{
  "token": "<invitation-token>",
  "first_name": "Ada",
  "last_name": "Coordinator",
  "phone": "+2348000000000",
  "password": "a-strong-password"
}
```

The server uses the invitation's email, department, and programme. Success (`201`) returns `{ "server_time", "user", "access", "refresh" }`; store the tokens as for login. Invalid/expired links return `invitation_invalid` (`400`); an existing email returns `email_taken` (`409`); delivery is not attempted by this endpoint.

## Profile and password endpoints

### `GET /me/student-profile/` and `GET /me/coordinator-profile/`

Require an access token. Student success returns `profile` with `account`, `matric_no`, `department`, `programme`, and `email_verified`. Coordinator success returns `profile` with `account`, `department`, `programme`, and `phone`. A user without that profile receives `{ "message": "Profile doesn't exist" }` (`404`).

### `POST /me/password/`

Requires an access token. Request: `{ "current_password": "...", "new_password": "..." }`. The new password must pass Django's configured password validators. Success: `{ "message": "Password successfully changed" }`. An incorrect current password returns `current_password_invalid` (`400`).

## Password reset

### `POST /auth/forgot-password/`

Public. Request: `{ "email": "user@example.edu" }`. Success (`200`) always returns `{ "server_time": "...", "message": "If the account exists, reset instructions will be sent." }`. If the address belongs to an active account, the email links to the frontend route configured by `FRONTEND_URL` with `email` and `token` query parameters.

### `POST /auth/reset-password/`

Public. Read `email` and `token` from the reset link, then submit them with the new password:

```json
{ "email": "user@example.edu", "token": "<reset-token>", "password": "a-new-strong-password" }
```

Success (`200`): `{ "message": "Password has been reset." }`. An invalid or expired token returns `reset_token_invalid` (`400`).

There is currently no `/me/` route in the URL list; use the role-specific profile routes above.

## Frontend integration checklist

- Keep OTP input as text, exactly six digits.
- Show signup success as “check your email,” then offer resend with a neutral result message.
- After OTP verification, direct the student to sign in; verification does not automatically authenticate.
- For every protected request, use the access token. If refresh succeeds, replace both tokens before retrying the original request.
- On logout, send the refresh token and clear locally stored tokens.
- For coordinator acceptance, prefill the invitation email from validation as read-only and submit the link token; never ask the coordinator to type the token.
- Handle serializer validation objects separately from flow errors because their response shapes differ.
- Backend currently has no CSRF endpoint or refresh cookie flow; token exchange is JSON-based.
