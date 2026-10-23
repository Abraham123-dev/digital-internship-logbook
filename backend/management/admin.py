from django.contrib import admin

from .models import (
    AttendanceRecord,
    AttendanceSession,
    AuditLog,
    Cohort,
    CohortHoliday,
    EntryReview,
    ExtensionRequest,
    LogbookEntry,
    LogbookPhoto,
    SupervisorDetails,
    SupervisorReview,
    SupervisorReviewToken,
    SupervisorReviewWeek,
    WeeklySubmission,
)


admin.site.register([
    Cohort,
    CohortHoliday,
    WeeklySubmission,
    LogbookEntry,
    LogbookPhoto,
    EntryReview,
    ExtensionRequest,
    AttendanceSession,
    AttendanceRecord,
    SupervisorDetails,
    SupervisorReview,
    SupervisorReviewWeek,
    SupervisorReviewToken,
    AuditLog,
])
