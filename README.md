# Logr — Digital Internship Logbook

Logr is a digital logbook for Obafemi Awolowo University engineering students completing **SWEP** and **SIWES** placements. Students record their work and attendance, coordinators manage cohorts and review logbooks, and SIWES workplace supervisors provide a review and signature through a secure link.

## Project status

The repository contains a Django REST API and a Next.js web application. API behavior and request details are documented in the [Frontend Guide](FRONTEND_GUIDE.md). Screenshots and product demonstrations will be added here later.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python, Django 6.1, Django REST Framework |
| Data | PostgreSQL in deployment; SQLite for a simple local setup |
| Authentication | Custom `LogrAccount`, JWT access and refresh tokens |
| Email | Gmail API with OAuth 2.0 |
| Uploaded media | Cloudinary |
| Cache and scheduled work | Django cache; a Django management command run by a Render Cron Job |

## Main features

- **Students:** email signup and OTP verification, logbook entries, SWEP attendance, deadline extensions, and SIWES supervisor sign-off.
- **Coordinators:** cohort setup, student oversight, attendance codes, submission review, grading, and extension decisions.
- **Administrators:** coordinator invitations, account oversight, and reports.
- **Supervisors:** review and sign submitted SIWES logbooks through an emailed link without creating an account.

## Source code and project layout

The source repository is [Logr-edu/digital-internship-logbook](https://github.com/Logr-edu/digital-internship-logbook). Clone it if you have repository access:

```bash
git clone https://github.com/Logr-edu/digital-internship-logbook.git
cd digital-internship-logbook
```

```text
backend/      Django project, authentication app, and management app
frontend/     Next.js web application
scripts/      Local Gmail sender authorization helper
manage.py     Django management entry point
```

The repository does not currently include a `LICENSE` file; licensing terms have not been specified here.

## Run locally

Run the backend and frontend in separate terminals. See [backend/README.md](backend/README.md) for backend configuration, including Gmail and Cloudinary. Never commit `.env`, `.env.local`, `credentials.json`, or OAuth tokens.

### Backend

From the repository root, create and activate a Python virtual environment, install dependencies, set up the local `.env` as described in the [backend README](backend/README.md), then run:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

The API base URL is `http://127.0.0.1:8000/api/v1/`. The Django admin is at `http://127.0.0.1:8000/admin/`. Add departments in the admin before testing signup or invitations.

### Frontend

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`. Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Project documentation

- [Backend setup and development](backend/README.md)
- [Technical report handoff](TECHNICAL_REPORT_HANDOFF.md)
- [Frontend integration guide and API behavior](FRONTEND_GUIDE.md)
- [Deployment checklist](DEPLOYMENT_TO_DO.md)
- [Authentication execution plan](AUTH_EXECUTION_PLAN.md)
- [Management execution plan](MANAGEMENT_EXECUTION_PLAN.md)

## Screenshots and demonstrations

Coming soon.
