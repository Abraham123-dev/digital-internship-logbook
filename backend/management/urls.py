from django.urls import path

from . import views


urlpatterns = [
    path("coordinator/cohorts/", views.CoordinatorCohortView.as_view()),
    path("coordinator/cohorts/<int:cohort_id>/", views.CoordinatorCohortDetailView.as_view()),
    path("cohorts/current/", views.CurrentCohortView.as_view()),
    path("admin/cohorts/", views.AdminCohortListView.as_view()),
    path("admin/cohorts/<int:cohort_id>/", views.AdminCohortDetailView.as_view()),

    path("coordinator/attendance/sessions/", views.AttendanceSessionCreateView.as_view()),
    path("coordinator/attendance/sessions/current/", views.CurrentAttendanceSessionView.as_view()),
    path("coordinator/attendance/sessions/<int:session_id>/end/", views.EndAttendanceSessionView.as_view()),
    path("student/attendance/", views.AttendanceSubmitView.as_view()),
    path("student/attendance/history/", views.AttendanceHistoryView.as_view()),
    path("coordinator/students/<int:student_id>/attendance/", views.AttendanceOverrideView.as_view()),

    path("student/logbook/", views.StudentLogbookHomeView.as_view()),
    path("student/logbook/weeks/<int:week_no>/", views.StudentWeekView.as_view()),
    path("student/logbook/weeks/<int:week_no>/extension-request/", views.StudentExtensionRequestView.as_view()),
    path("student/logbook/days/<str:entry_date>/", views.StudentDayView.as_view()),
    path("student/logbook/days/<str:entry_date>/photos/", views.StudentLogbookPhotoView.as_view()),
    path("student/logbook/photos/<int:photo_id>/", views.StudentLogbookPhotoView.as_view()),
    path("coordinator/students/", views.CoordinatorStudentListView.as_view()),
    path("coordinator/dashboard/", views.CoordinatorDashboardView.as_view()),
    path("coordinator/extension-requests/", views.CoordinatorExtensionRequestListView.as_view()),
    path("coordinator/extension-requests/<int:request_id>/decision/", views.CoordinatorExtensionDecisionView.as_view()),
    path("coordinator/students/<int:student_id>/", views.CoordinatorStudentDetailView.as_view()),
    path("coordinator/weeks/<int:week_id>/", views.CoordinatorWeekView.as_view()),
    path("coordinator/entries/<int:entry_id>/review/", views.CoordinatorEntryReviewView.as_view()),
    path("coordinator/weeks/<int:week_id>/finish/", views.CoordinatorFinishWeekView.as_view()),
    path("coordinator/weeks/<int:week_id>/return/", views.CoordinatorReturnWeekView.as_view()),

    path("student/supervisor-reviews/", views.StudentSupervisorReviewView.as_view()),
    path("student/supervisor-reviews/<int:review_id>/resend/", views.ResendSupervisorReviewView.as_view()),
    path("supervisor/review/", views.SupervisorReviewView.as_view()),
    path("supervisor/review/request-link/", views.SupervisorRequestNewLinkView.as_view()),

    path("admin/users/", views.AdminUserListView.as_view()),
    path("admin/overview/", views.AdminOverviewView.as_view()),
    path("admin/users/<int:user_id>/status/", views.AdminUserStatusView.as_view()),
    path("admin/users/<int:user_id>/", views.AdminUserDeleteView.as_view()),
    path("admin/students/<int:student_id>/assignment/", views.AdminStudentAssignmentView.as_view()),
    path("admin/students/<int:student_id>/reassign/", views.AdminStudentReassignView.as_view()),
    path("admin/coordinators/<int:coordinator_id>/reassign/", views.AdminCoordinatorReassignView.as_view()),
    path("admin/students/<int:student_id>/programme/", views.AdminStudentProgrammeView.as_view()),
    path("admin/reports/", views.AdminReportView.as_view()),
    path("admin/supervisor-reviews/<int:review_id>/void/", views.AdminSupervisorReviewVoidView.as_view()),
    path("admin/audit-logs/", views.AdminAuditLogView.as_view()),
]
