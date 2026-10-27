import hashlib
import secrets
from datetime import time, timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from backend.auth.models import CoordinatorProfile, Department, Faculty, Programme, StudentProfile


def default_working_days():
    return [0, 1, 2, 3, 4]


def supervisor_token_expiry():
    return timezone.now() + timedelta(days=14)


class Cohort(models.Model):
    """A programme run for a faculty across one or more departments."""

    # Faculty-level metadata (new)
    name = models.CharField(max_length=200, blank=True)  # auto-generated or custom
    faculty = models.ForeignKey(
        Faculty, null=True, blank=True, on_delete=models.PROTECT, related_name="cohorts"
    )

    # Legacy single-department fields — kept nullable for backward compat.
    # For new cohorts use CohortDepartmentAssignment instead.
    department = models.ForeignKey(
        Department, null=True, blank=True, on_delete=models.PROTECT
    )
    coordinator = models.ForeignKey(
        CoordinatorProfile, null=True, blank=True, on_delete=models.PROTECT
    )

    programme = models.CharField(max_length=10, choices=Programme.choices)
    level = models.PositiveSmallIntegerField(choices=[(200, "200L"), (300, "300L"), (400, "400L")], null=True, blank=True)
    session = models.CharField(max_length=20)
    start_date = models.DateField()
    end_date = models.DateField()
    working_days = models.JSONField(default=default_working_days)
    deadline_weekday = models.PositiveSmallIntegerField(default=5)
    deadline_time = models.TimeField(default=time(23, 59, 59))
    max_grace_days = models.PositiveSmallIntegerField(default=7)
    request_window_days = models.PositiveSmallIntegerField(default=14)
    max_extensions_per_week = models.PositiveSmallIntegerField(default=1)
    correction_days = models.PositiveSmallIntegerField(default=2)
    min_filled_chars = models.PositiveSmallIntegerField(default=20)
    attendance_max_minutes = models.PositiveSmallIntegerField(default=3)
    attendance_max_codes_per_day = models.PositiveSmallIntegerField(default=3)
    missed_weeks_count_as_zero = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def status(self):
        today = timezone.localdate()
        if today < self.start_date:
            return "UPCOMING"
        if today > self.end_date:
            return "CLOSED"
        return "ACTIVE"

    @property
    def total_weeks(self):
        days = (self.end_date - self.start_date).days + 1
        return (days + self.start_date.weekday() - 1) // 7 + 1

    def generate_default_name(self):
        """Build a name like 'SWEP 2026/2027 - FCSE'. Requires faculty to be set."""
        faculty_code = self.faculty.code if self.faculty else "?"
        return f"{self.programme}{f' {self.level}L' if self.level else ''} {self.session} - {faculty_code}"

    def save(self, *args, **kwargs):
        if not self.name and self.faculty:
            self.name = self.generate_default_name()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name or f"{self.programme} {self.session}"


class CohortDepartmentAssignment(models.Model):
    """Maps a department (and optionally a coordinator) to a faculty-wide cohort."""

    cohort = models.ForeignKey(
        Cohort, on_delete=models.CASCADE, related_name="department_assignments"
    )
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="cohort_assignments"
    )
    coordinator = models.ForeignKey(
        CoordinatorProfile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cohort_assignments",
    )

    class Meta:
        unique_together = [("cohort", "department")]

    def __str__(self):
        return f"{self.cohort} / {self.department.name}"


class CohortHoliday(models.Model):
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="holidays")
    date = models.DateField()
    label = models.CharField(max_length=100, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cohort", "date"], name="unique_cohort_holiday")
        ]


class WeeklySubmission(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        SUBMITTED = "SUBMITTED", "Submitted"
        RETURNED = "RETURNED", "Returned"
        REVIEWED = "REVIEWED", "Reviewed"

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="weeks")
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="weeks")
    week_no = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    deadline_at = models.DateTimeField()
    extended_until = models.DateTimeField(null=True, blank=True)
    reminder_sent_for = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_late = models.BooleanField(default=False)
    returned_at = models.DateTimeField(null=True, blank=True)
    correction_deadline = models.DateTimeField(null=True, blank=True)
    return_comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "week_no"], name="unique_student_week")
        ]
        ordering = ["week_no"]


class ExtensionRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    week = models.ForeignKey(WeeklySubmission, on_delete=models.CASCADE, related_name="extension_requests")
    reason = models.CharField(max_length=500)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(CoordinatorProfile, null=True, blank=True, on_delete=models.SET_NULL)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_until = models.DateTimeField(null=True, blank=True)
    decision_comment = models.CharField(max_length=500, blank=True)


class LogbookEntry(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        RETURNED = "RETURNED", "Returned"
        REVIEWED = "REVIEWED", "Reviewed"

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="entries")
    week = models.ForeignKey(WeeklySubmission, on_delete=models.CASCADE, related_name="entries")
    entry_date = models.DateField()
    activities = models.TextField(blank=True)
    skills = models.TextField(blank=True)
    review_text = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "entry_date"], name="unique_student_entry_date")
        ]
        ordering = ["entry_date"]


class LogbookPhoto(models.Model):
    entry = models.ForeignKey(LogbookEntry, on_delete=models.CASCADE, related_name="photos")
    cloudinary_key = models.CharField(max_length=500)
    file_format = models.CharField(max_length=5)
    created_at = models.DateTimeField(auto_now_add=True)


class EntryReview(models.Model):
    entry = models.OneToOneField(LogbookEntry, on_delete=models.CASCADE, related_name="coordinator_review")
    coordinator = models.ForeignKey(CoordinatorProfile, on_delete=models.PROTECT)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now=True)


class AttendanceSession(models.Model):
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="attendance_sessions")
    date = models.DateField()
    code_hash = models.CharField(max_length=64)
    salt = models.CharField(max_length=32)
    started_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(CoordinatorProfile, on_delete=models.PROTECT)
    duration_minutes = models.PositiveSmallIntegerField(default=3)

    @property
    def is_active(self):
        return self.ended_at is None and timezone.now() < self.expires_at

    @staticmethod
    def hash_code(salt, code):
        return hashlib.sha256(f"{salt}{code}".encode()).hexdigest()


class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        EXCUSED = "EXCUSED", "Excused"
        ABSENT = "ABSENT", "Absent"

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="attendance_records")
    date = models.DateField()
    session = models.ForeignKey(AttendanceSession, null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=10, choices=Status.choices)
    marked_at = models.DateTimeField(default=timezone.now)
    marked_by = models.ForeignKey(
        CoordinatorProfile, null=True, blank=True, on_delete=models.SET_NULL
    )
    reason = models.CharField(max_length=300, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "date"], name="unique_student_attendance_date")
        ]
        ordering = ["-date"]


class SupervisorDetails(models.Model):
    student = models.OneToOneField(StudentProfile, on_delete=models.CASCADE, related_name="supervisor")
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    organisation = models.CharField(max_length=200, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class SupervisorReview(models.Model):
    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        REVIEWED = "REVIEWED", "Reviewed"
        EXPIRED = "EXPIRED", "Expired"
        VOID = "VOID", "Voided"

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="supervisor_reviews")
    supervisor = models.ForeignKey(SupervisorDetails, on_delete=models.PROTECT)
    batch_no = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SENT)
    sent_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    name_snapshot = models.CharField(max_length=150)
    email_snapshot = models.EmailField()
    phone_snapshot = models.CharField(max_length=30)
    organisation_snapshot = models.CharField(max_length=200, blank=True)
    review_text = models.TextField(blank=True)
    signature_type = models.CharField(max_length=10, blank=True)
    signature_key = models.CharField(max_length=500, blank=True)
    signed_name = models.CharField(max_length=150, blank=True)
    reviewer_ip = models.GenericIPAddressField(null=True, blank=True)
    reviewer_agent = models.CharField(max_length=300, blank=True)
    last_resend_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["student", "batch_no"], name="unique_student_review_batch")
        ]
        ordering = ["-batch_no"]


class SupervisorReviewWeek(models.Model):
    review = models.ForeignKey(SupervisorReview, on_delete=models.CASCADE, related_name="week_links")
    week = models.OneToOneField(WeeklySubmission, on_delete=models.PROTECT, related_name="supervisor_link")


class SupervisorReviewToken(models.Model):
    review = models.ForeignKey(SupervisorReview, on_delete=models.CASCADE, related_name="tokens")
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField(default=supervisor_token_expiry)
    used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    open_count = models.PositiveIntegerField(default=0)

    @staticmethod
    def hash_token(token):
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def new_token():
        token = secrets.token_urlsafe(32)
        return token, SupervisorReviewToken.hash_token(token)

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at


class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=60)
    target_type = models.CharField(max_length=60)
    target_id = models.PositiveIntegerField()
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class InAppNotification(models.Model):
    class Trigger(models.TextChoices):
        WEEK_UNSUBMITTED_FRIDAY = "week_unsubmitted_friday", "Week unsubmitted Friday"
        WEEK_UNSUBMITTED_SATURDAY = "week_unsubmitted_saturday", "Week unsubmitted Saturday"
        WEEK_LOCKED = "week_locked", "Week locked"
        WEEK_SUBMITTED_COORDINATOR = "week_submitted_coordinator", "Week submitted to coordinator"
        EXTENSION_REQUESTED = "extension_requested", "Extension requested"
        EXTENSION_APPROVED = "extension_approved", "Extension approved"
        EXTENSION_DENIED = "extension_denied", "Extension denied"
        WEEK_RETURNED = "week_returned", "Week returned"
        WEEK_REVIEWED = "week_reviewed", "Week reviewed"
        SUPERVISOR_DETAILS_RECEIVED = "supervisor_details_received", "Supervisor details received"
        SUPERVISOR_REVIEW_SUBMITTED = "supervisor_review_submitted", "Supervisor review submitted"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    trigger = models.CharField(max_length=40, choices=Trigger.choices)
    message = models.CharField(max_length=300)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link_to = models.CharField(max_length=300, blank=True)
    dedupe_key = models.CharField(max_length=180, unique=True, null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

