# Logr Backend

The Logr backend is a Django REST Framework API for student logbooks, coordinator workflows, and SIWES supervisor reviews. The project root contains `manage.py`, `requirements.txt`, and the shared [Frontend Guide](../FRONTEND_GUIDE.md), which documents endpoint requests and responses.

## Backend stack

- Python
- Django 6.1 and Django REST Framework
- PostgreSQL in deployment; SQLite is used locally when `DATABASE_URL` is unset
- A custom `LogrAccount` model with JWT authentication
- Django cache for OTP and pending-signup lifetimes
- Gmail API with OAuth 2.0 for OTPs, invitations, and other email
- Cloudinary for uploaded logbook media and supervisor signatures
- A Django management command for scheduled reminders

## Backend apps

| App | Responsibility |
| --- | --- |
| `backend.auth` | `LogrAccount`, student and coordinator profiles, signup and OTP verification, login, password flows, and coordinator invitations |
| `backend.management` | Cohorts, attendance, logbook entries and reviews, extensions, SIWES supervisor reviews, notifications, and admin workflows |

`backend/auth/apps.py` sets the Django app label to `accounts`. The configured user model is `accounts.LogrAccount`.

## Get the code

From a terminal, clone the project if you have access to its GitHub repository:

```bash
git clone https://github.com/Logr-edu/digital-internship-logbook.git
cd digital-internship-logbook
```

The backend is the repository root Django project; `backend/` contains its settings and Django apps. Run `manage.py` and install `requirements.txt` from the repository root, not from inside the `backend/` directory.

## Local installation

Use a Python version supported by the Django version pinned in `requirements.txt`.

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a private `.env` file in the repository root. A basic local configuration is:

```dotenv
SECRET_KEY=replace-with-a-random-local-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:3000
STUDENT_EMAIL_DOMAINS=student.oauife.edu.ng
```

`DATABASE_URL` is optional for local development; without it the backend uses the root-level SQLite database. Add real values for the integrations you intend to use:

| Variable | Purpose |
| --- | --- |
| `GMAIL_CLIENT_ID` | Google OAuth client ID for the shared Gmail sender |
| `GMAIL_CLIENT_SECRET` | Secret for that same OAuth client |
| `GMAIL_REFRESH_TOKEN` | Refresh token authorized for Gmail sending |
| `GMAIL_SENDER_EMAIL` | Gmail address that sends OTPs and invitations; `GMAIL_FROM_EMAIL` is accepted as a fallback |
| `STUDENT_EMAIL_DOMAINS` | Comma-separated, exact domains allowed for student signup, without `@` |
| `CLOUDINARY_URL` | Cloudinary credentials for media upload features |
| `CACHE_BACKEND` | Set to `database` to use Django's shared database cache; otherwise local-memory cache is used |
| `CACHE_TABLE` | Optional database-cache table name; defaults to `django_cache` |
| `DATABASE_URL` | Optional database connection URL; SQLite is the default when omitted |
| `FRONTEND_URL` | Frontend origin used to build invitation and email links |
| `ALLOWED_HOSTS` | Comma-separated host names accepted by Django |

Keep `.env`, OAuth credentials, and refresh tokens private. `credentials.json` is used by the one-time local Gmail authorization script and must not be committed.

### Gmail sender authorization

Email delivery requires the Gmail API to be enabled in the Google Cloud project associated with the OAuth client. Create a **Desktop app** OAuth client, place its downloaded credentials in `credentials.json` at the repository root, then run:

```powershell
python scripts/authorize_gmail_sender.py
```

Authorize the shared sender mailbox and add the resulting refresh token, client ID, client secret, and sender address to `.env`. The API uses these credentials to send email; student or coordinator signup does not start an OAuth browser flow. For production OAuth and Render configuration, follow [DEPLOYMENT_TO_DO.md](../DEPLOYMENT_TO_DO.md).

## Initialize and run

From the repository root, apply database migrations and create an admin account:

```bash
python manage.py migrate
python manage.py createsuperuser
```

Start the development server:

```bash
python manage.py runserver 127.0.0.1:8000
```

The API is available under `http://127.0.0.1:8000/api/v1/`; Django Admin is at `http://127.0.0.1:8000/admin/`. Sign in to Django Admin and add departments before testing student signup or sending coordinator invitations.

By default, local-memory cache is sufficient while the development server stays running. If using the database cache, set `CACHE_BACKEND=database`, apply migrations, then create the cache table once:

```bash
python manage.py createcachetable
```

## API and supporting documentation

- [Frontend Guide](../FRONTEND_GUIDE.md): endpoint paths, authentication requirements, request bodies, response shapes, and common errors.
- [Deployment checklist](../DEPLOYMENT_TO_DO.md): Render environment variables, migrations, Gmail OAuth, and the scheduled reminder command.
- [Root project README](../README.md): project summary, both application stacks, and full local startup overview.

The scheduled reminder command is `python manage.py send_deadline_reminders`. It is intended to run on a schedule, such as through a Render Cron Job; it does not require a Celery worker or Redis.
