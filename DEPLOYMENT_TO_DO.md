# Deployment To Do

This checklist sets up the Django API and the 24-hour logbook deadline reminder on Render. The reminder uses a Django management command and Render Cron Job. It does not use Celery or Redis.

## 1. Prepare the project

- Push the latest project code to the Git branch Render will deploy. This includes `send_deadline_reminders` and migration `0005_weeklysubmission_reminder_sent_for`.
- Confirm `requirements.txt` is in the repository root with the Cloudinary dependency.
- Do not commit `.env`, Gmail OAuth credentials, `CLOUDINARY_URL`, or other secrets. Add secrets in the Render dashboard.

## 2. Configure the Django web service

Create or open the Render **Web Service** connected to this repository. Set its root directory to the project root, where `manage.py` and `requirements.txt` are located. Keep its existing production start command. The Cron Job is a separate Render service and will use the same repository and project root.

For the web service, its build command must install `requirements.txt`, and its start command must run the Django WSGI application using a production WSGI server. Do not use the reminder command as the web service start command; it is only for the Cron Job below.

Add the following environment variables under the web service's **Environment** settings. Use the actual values for your project; never paste secrets into this file or commit them.

To generate a Django secret key locally, run this from the project environment and paste the output into Render's `SECRET_KEY` field:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

| Variable | Required | Value to provide |
| --- | --- | --- |
| `SECRET_KEY` | Yes | A long, random Django secret key. |
| `DEBUG` | Yes | `False` in production. |
| `ALLOWED_HOSTS` | Yes | Your backend hostname, for example `your-api.onrender.com`. Separate multiple hosts with commas. |
| `DATABASE_URL` | Yes | The connection URL for the production PostgreSQL database. Use the same database for the web service and cron job. |
| `FRONTEND_URL` | Yes | The deployed frontend origin, including `https://`; this also sets the project's CORS and CSRF trusted origin. |
| `STUDENT_EMAIL_DOMAINS` | Yes for student signup | Approved student email domains separated by commas, with no `@`, for example `students.example.edu,example.edu`. Replace these examples with the actual domains. |
| `GMAIL_CLIENT_ID` | Yes for email | OAuth client ID for the Gmail sender. |
| `GMAIL_CLIENT_SECRET` | Yes for email | OAuth client secret for the Gmail sender. Keep it private. |
| `GMAIL_REFRESH_TOKEN` | Yes for email | Refresh token created by the project's Gmail sender authorization script. Keep it private. |
| `GMAIL_SENDER_EMAIL` | Yes for email | The Gmail address authorized to send OTPs, invitations, and reminders. |
| `CLOUDINARY_URL` | Yes for media uploads | The Cloudinary API environment variable from Cloudinary's API Keys page. Keep its API secret private. |
| `CACHE_BACKEND` | Recommended for multiple instances | Set to `database` to use Django's shared database cache. |
| `CACHE_TABLE` | Optional | Defaults to `django_cache`; only set this if using a different cache table name. |
| `GMAIL_TOKEN_URI` | Optional | Defaults to `https://oauth2.googleapis.com/token`. |

`GMAIL_FROM_EMAIL` is accepted as an alternative to `GMAIL_SENDER_EMAIL`, but use `GMAIL_SENDER_EMAIL` for a new setup.

If `CACHE_BACKEND=database`, create the cache table once after migrations:

```bash
python manage.py createcachetable
```

## 3. Apply database migrations

Before the cron job runs, apply the project's migrations to the production database. In Render, open the web service Shell and run:

```bash
python manage.py migrate
```

The migrations create the management tables and the `reminder_sent_for` field that prevents duplicate reminder emails. If the Render web service has a **Pre-Deploy Command** configured, `python manage.py migrate` can be placed there so each deployment applies migrations before the new code starts.

If this is a brand-new database, create the first superuser from the web service Shell as well:

```bash
python manage.py createsuperuser
```

## 4. Create the Render Cron Job

In the Render dashboard:

1. Select **New** > **Cron Job**.
2. Connect the same repository and branch used by the web service.
3. Set the root directory to the project root containing `manage.py` and `requirements.txt`.
4. Set the runtime to **Python**.
5. Enter these commands:

   | Render field | Value |
   | --- | --- |
   | Build Command | `pip install -r requirements.txt` |
   | Command | `python manage.py send_deadline_reminders` |
   | Schedule | `*/5 * * * *` |

6. Add the cron job's environment variables. At minimum, copy the same `SECRET_KEY`, `DATABASE_URL`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`, and `GMAIL_TOKEN_URI` values used by the web service. The simplest way to keep them synchronized is to use a Render Environment Group shared by both services. The cron job does not need `CLOUDINARY_URL` for reminders, but the web service does for media uploads.
7. Save and deploy the Cron Job.

The schedule expression is UTC. `*/5 * * * *` means run every five minutes. The command checks for open logbook weeks whose effective deadline is within a ten-minute window around 24 hours from its run time. Running every five minutes lets it catch that window closely. Render runs the command and stops the job when the command exits; no always-running worker is needed. See [Render Cron Jobs documentation](https://render.com/docs/cronjobs).

## 5. Check the setup

Run these checks from the project root before relying on reminders:

```bash
python manage.py check
python manage.py test backend.management
python manage.py send_deadline_reminders
```

The last command is a real send operation: it emails any students with an eligible deadline at that moment. Run it manually only when that is intended. In Render, check the Cron Job's **Runs** and logs after its first scheduled run. A successful run reports the number sent and any Gmail delivery failures. The `reminder_sent_for` value is saved after successful delivery, so repeated runs do not resend for the same deadline. A later approved extension has a different deadline and can receive its own reminder.

## 6. Local Windows testing (optional)

You can run the same command manually from PowerShell:

```powershell
.\venv\Scripts\python.exe manage.py send_deadline_reminders
```

To automate local testing, use Windows Task Scheduler with the project virtual environment's `python.exe`, arguments `manage.py send_deadline_reminders`, and the project root as **Start in**. Set the trigger to repeat every five minutes. Local scheduling is useful for development; use Render Cron Job for production.
