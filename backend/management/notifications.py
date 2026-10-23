from datetime import time, timedelta

from django.utils import timezone

from .models import InAppNotification, WeeklySubmission


def create_notification(user, trigger, message, link_to="", dedupe_key=None):
    if user is None:
        return None

    values = {
        "user": user,
        "trigger": trigger,
        "message": message,
        "link_to": link_to,
    }
    if dedupe_key:
        notification, created = InAppNotification.objects.get_or_create(
            dedupe_key=dedupe_key,
            defaults=values,
        )
    else:
        notification = InAppNotification.objects.create(**values)
        created = True
    return notification, created


def create_scheduled_notifications(now=None):
    """Create scheduled week reminders and deadline-lock notifications."""
    now = now or timezone.now()
    local_now = timezone.localtime(now)
    local_date = local_now.date()

    reminder_trigger = None
    reminder_date = None
    if local_now.weekday() == 4 and time(15, 0) <= local_now.time().replace(tzinfo=None) < time(15, 5):
        reminder_trigger = InAppNotification.Trigger.WEEK_UNSUBMITTED_FRIDAY
        reminder_date = local_date + timedelta(days=1)
    elif local_now.weekday() == 5 and time(18, 0) <= local_now.time().replace(tzinfo=None) < time(18, 5):
        reminder_trigger = InAppNotification.Trigger.WEEK_UNSUBMITTED_SATURDAY
        reminder_date = local_date

    sent = 0
    weeks = WeeklySubmission.objects.filter(
        status=WeeklySubmission.Status.OPEN,
    ).select_related("student__user", "cohort")

    for week in weeks:
        deadline = max(week.deadline_at, week.extended_until or week.deadline_at)
        if deadline <= now:
            create_notification(
                week.student.user,
                InAppNotification.Trigger.WEEK_LOCKED,
                f"Your logbook for week {week.week_no} is past its deadline and is locked.",
                link_to=f"/student/week/{week.week_no}",
                dedupe_key=f"week_locked:{week.pk}:{deadline.isoformat()}",
            )

        if reminder_trigger and timezone.localtime(deadline).date() == reminder_date:
            _, created = create_notification(
                week.student.user,
                reminder_trigger,
                f"Your logbook for week {week.week_no} is still unsubmitted and is due soon.",
                link_to=f"/student/week/{week.week_no}",
                dedupe_key=f"{reminder_trigger}:{week.pk}:{reminder_date.isoformat()}",
            )
            sent += int(created)

    return sent
