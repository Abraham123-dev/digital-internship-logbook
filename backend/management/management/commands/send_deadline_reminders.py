from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from backend.auth.email_service import EmailDeliveryError, send_email
from backend.management.models import WeeklySubmission


REMINDER_LEAD_TIME = timedelta(hours=24)
RUN_WINDOW = timedelta(minutes=5)


class Command(BaseCommand):
    help = "Email students a reminder about logbook weeks due in 24 hours."

    def handle(self, *args, **options):
        now = timezone.now()
        earliest_deadline = now + REMINDER_LEAD_TIME - RUN_WINDOW
        latest_deadline = now + REMINDER_LEAD_TIME + RUN_WINDOW

        weeks = WeeklySubmission.objects.filter(
            status=WeeklySubmission.Status.OPEN,
        ).filter(
            Q(deadline_at__range=(earliest_deadline, latest_deadline))
            | Q(extended_until__range=(earliest_deadline, latest_deadline))
        ).select_related("student__user", "cohort")

        sent = 0
        failed = 0
        for week in weeks:
            deadline = max(
                week.deadline_at,
                week.extended_until or week.deadline_at,
            )
            if not earliest_deadline <= deadline <= latest_deadline:
                continue
            if week.reminder_sent_for == deadline:
                continue

            try:
                send_email(
                    recipient=week.student.user.email,
                    subject=f"Logr logbook reminder: week {week.week_no} is due soon",
                    body=(
                        f"Your logbook for week {week.week_no} is due on "
                        f"{timezone.localtime(deadline).strftime('%A, %d %B at %H:%M %Z')}. "
                        "Please complete and submit it before the deadline."
                    ),
                )
            except EmailDeliveryError:
                failed += 1
                self.stderr.write(f"Could not send a reminder for week {week.pk}.")
                continue

            week.reminder_sent_for = deadline
            week.save(update_fields=["reminder_sent_for"])
            sent += 1

        self.stdout.write(self.style.SUCCESS(f"Sent {sent} reminder(s); {failed} failed."))
