from datetime import date, datetime, time, timedelta
from io import StringIO
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from django.core.management import call_command
from rest_framework.test import APIClient

from backend.auth.models import CoordinatorProfile, Department, LogrAccount, Programme, StudentProfile
from .models import Cohort, ExtensionRequest, InAppNotification, SupervisorDetails, WeeklySubmission
from .notifications import create_scheduled_notifications
from .views import assign_students


class CohortAssignmentTests(TestCase):
    def setUp(self):
        self.department = Department.objects.create(name="Computer Science")
        self.other_department = Department.objects.create(name="Physics")
        self.user = LogrAccount.objects.create_user("coordinator@example.com", "pass")
        self.coordinator = CoordinatorProfile.objects.create(
            user=self.user,
            department=self.department,
            programme=Programme.SWEP,
            phone="+2348000000000",
        )
        self.cohort = Cohort.objects.create(
            department=self.department,
            coordinator=self.coordinator,
            programme=Programme.SWEP,
            session="2026/2027",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
        )

    def make_student(self, email, department, programme=Programme.SWEP, cohort=None):
        user = LogrAccount.objects.create_user(email, "pass")
        return StudentProfile.objects.create(
            user=user,
            matric_no=email,
            department=department,
            programme=programme,
            cohort=cohort,
        )

    def test_matching_students_are_assigned(self):
        matching = self.make_student("one@example.com", self.department)
        other_department = self.make_student("two@example.com", self.other_department)
        other_programme = self.make_student("three@example.com", self.department, Programme.SIWES)

        assign_students(self.cohort)

        matching.refresh_from_db()
        self.assertEqual(matching.cohort, self.cohort)
        self.assertEqual(matching.coordinator, self.coordinator)
        self.assertIsNone(other_department.cohort)
        self.assertIsNone(other_programme.cohort)

    def test_existing_assignment_is_not_replaced(self):
        other_cohort = Cohort.objects.create(
            department=self.department,
            coordinator=self.coordinator,
            programme=Programme.SWEP,
            session="2025/2026",
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=30),
        )
        student = self.make_student("assigned@example.com", self.department, cohort=other_cohort)

        assign_students(self.cohort)

        student.refresh_from_db()
        self.assertEqual(student.cohort, other_cohort)

    def test_coordinator_can_see_saved_siwes_supervisor_details(self):
        student = self.make_student(
            "siwes@example.com", self.department, programme=Programme.SIWES
        )
        student.coordinator = self.coordinator
        student.save(update_fields=["coordinator"])
        SupervisorDetails.objects.create(
            student=student,
            name="Ada Supervisor",
            email="ada@example.com",
            phone="+2348000000000",
            organisation="Example Company",
        )
        client = APIClient()
        client.force_authenticate(self.user)

        list_response = client.get("/api/v1/coordinator/students/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data["results"][0]["supervisorName"], "Ada Supervisor")

        detail_response = client.get(f"/api/v1/coordinator/students/{student.pk}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["supervisor"], {
            "name": "Ada Supervisor",
            "email": "ada@example.com",
            "phone": "+2348000000000",
            "organisation": "Example Company",
        })

    def test_admin_reassignment_moves_students_and_deactivates_old_coordinator(self):
        student = self.make_student("move@example.com", self.department)
        student.coordinator = self.coordinator
        student.cohort = self.cohort
        student.save(update_fields=["coordinator", "cohort"])

        new_user = LogrAccount.objects.create_user("new@example.com", "pass")
        new_coordinator = CoordinatorProfile.objects.create(
            user=new_user,
            department=self.department,
            programme=Programme.SWEP,
            phone="+2348000000001",
        )
        admin = LogrAccount.objects.create_superuser("admin@example.com", "pass")
        client = APIClient()
        client.force_authenticate(admin)

        response = client.post(
            f"/api/v1/admin/coordinators/{self.coordinator.pk}/reassign/",
            {"new_coordinator_id": new_coordinator.pk},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        student.refresh_from_db()
        self.user.refresh_from_db()
        self.cohort.refresh_from_db()
        self.assertEqual(student.coordinator, new_coordinator)
        self.assertEqual(self.cohort.coordinator, new_coordinator)
        self.assertFalse(self.user.is_active)

    def test_student_requests_extension_and_coordinator_approves_it(self):
        student = self.make_student("extension@example.com", self.department)
        student.cohort = self.cohort
        student.coordinator = self.coordinator
        student.save(update_fields=["cohort", "coordinator"])
        week = WeeklySubmission.objects.create(
            student=student,
            cohort=self.cohort,
            week_no=1,
            deadline_at=timezone.now() - timedelta(days=1),
        )

        student_client = APIClient()
        student_client.force_authenticate(student.user)
        response = student_client.post(
            "/api/v1/student/logbook/weeks/1/extension-request/",
            {"reason": "I was unwell and could not complete the entries."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        extension = ExtensionRequest.objects.get(week=week)
        self.assertTrue(InAppNotification.objects.filter(
            user=self.user,
            trigger=InAppNotification.Trigger.EXTENSION_REQUESTED,
        ).exists())
        coordinator_client = APIClient()
        coordinator_client.force_authenticate(self.user)
        response = coordinator_client.post(
            f"/api/v1/coordinator/extension-requests/{extension.pk}/decision/",
            {"decision": "APPROVED", "days": 3},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        week.refresh_from_db()
        extension.refresh_from_db()
        self.assertEqual(extension.status, ExtensionRequest.Status.APPROVED)
        self.assertIsNotNone(week.extended_until)
        self.assertTrue(InAppNotification.objects.filter(
            user=student.user,
            trigger=InAppNotification.Trigger.EXTENSION_APPROVED,
        ).exists())

    def test_verified_signup_attaches_student_to_matching_cohort(self):
        pending_user = LogrAccount.objects.create_user(
            "signup@example.com",
            "pass",
            is_active=False,
            role=LogrAccount.Role.STUDENT,
        )
        cache.set("student-otp-signup@example.com", "123456", timeout=600)
        cache.set(
            "pending-student-signup-signup@example.com",
            {
                "matric_no": "CS-100",
                "department_id": self.department.pk,
                "programme": Programme.SWEP,
            },
            timeout=600,
        )
        client = APIClient()

        response = client.post(
            "/api/v1/auth/student/verify-otp/",
            {"email": pending_user.email, "otp": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        profile = StudentProfile.objects.get(user=pending_user)
        self.assertEqual(profile.cohort, self.cohort)
        self.assertEqual(profile.coordinator, self.coordinator)

    @patch("backend.management.management.commands.send_deadline_reminders.send_email")
    def test_deadline_reminder_is_sent_once_for_the_current_deadline(self, send_email):
        student = self.make_student("reminder@example.com", self.department)
        deadline = timezone.now() + timedelta(hours=24)
        WeeklySubmission.objects.create(
            student=student,
            cohort=self.cohort,
            week_no=1,
            deadline_at=deadline,
        )

        call_command("send_deadline_reminders", stdout=StringIO())
        call_command("send_deadline_reminders", stdout=StringIO())

        self.assertEqual(send_email.call_count, 1)
        week = WeeklySubmission.objects.get(student=student)
        self.assertIsNotNone(week.reminder_sent_for)

    def test_notifications_can_be_listed_and_marked_read_only_by_their_owner(self):
        own = InAppNotification.objects.create(
            user=self.user,
            trigger=InAppNotification.Trigger.WEEK_SUBMITTED_COORDINATOR,
            message="Week submitted.",
            link_to="/coordinator/students/1",
        )
        InAppNotification.objects.create(
            user=self.user,
            trigger=InAppNotification.Trigger.EXTENSION_REQUESTED,
            message="Extension requested.",
        )
        other_user = LogrAccount.objects.create_user("other@example.com", "pass")
        other_notification = InAppNotification.objects.create(
            user=other_user,
            trigger=InAppNotification.Trigger.WEEK_RETURNED,
            message="Your week was returned.",
        )

        client = APIClient()
        client.force_authenticate(self.user)
        response = client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unreadCount"], 2)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIn(str(own.pk), [item["id"] for item in response.data["results"]])

        response = client.post(f"/api/v1/notifications/{own.pk}/read/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["isRead"])

        response = client.post("/api/v1/notifications/read-all/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 1)

        other_client = APIClient()
        other_client.force_authenticate(self.user)
        response = other_client.post(f"/api/v1/notifications/{other_notification.pk}/read/")
        self.assertEqual(response.status_code, 404)
        other_notification.refresh_from_db()
        self.assertFalse(other_notification.is_read)

    def test_scheduled_logbook_notifications_are_created_once(self):
        today = timezone.localdate()
        days_until_friday = (4 - today.weekday()) % 7 or 7
        friday = today + timedelta(days=days_until_friday)
        saturday = friday + timedelta(days=1)
        deadline = timezone.make_aware(datetime.combine(saturday, time(23, 59)))
        student = self.make_student("scheduled@example.com", self.department)
        week = WeeklySubmission.objects.create(
            student=student,
            cohort=self.cohort,
            week_no=1,
            deadline_at=deadline,
        )

        friday_afternoon = timezone.make_aware(datetime.combine(friday, time(15, 2)))
        self.assertEqual(create_scheduled_notifications(friday_afternoon), 1)
        self.assertEqual(create_scheduled_notifications(friday_afternoon), 0)
        self.assertEqual(InAppNotification.objects.filter(
            user=student.user,
            trigger=InAppNotification.Trigger.WEEK_UNSUBMITTED_FRIDAY,
        ).count(), 1)

        after_deadline = deadline + timedelta(minutes=5)
        create_scheduled_notifications(after_deadline)
        self.assertEqual(InAppNotification.objects.filter(
            user=student.user,
            trigger=InAppNotification.Trigger.WEEK_LOCKED,
        ).count(), 1)
        create_scheduled_notifications(after_deadline)
        week.refresh_from_db()
        self.assertEqual(InAppNotification.objects.filter(
            user=student.user,
            trigger=InAppNotification.Trigger.WEEK_LOCKED,
        ).count(), 1)


class TrainingLevelAndAttendanceTests(TestCase):
    def setUp(self):
        from .models import CohortDepartmentAssignment
        self.department = Department.objects.create(name="Level Test Department")
        self.coordinator_user = LogrAccount.objects.create_user("level-coordinator@example.com", "pass")
        self.coordinator = CoordinatorProfile.objects.create(user=self.coordinator_user,
            department=self.department, programme="SIWES", level=300, phone="123")
        self.cohorts = {}
        for level in (300, 400):
            cohort = Cohort.objects.create(programme="SIWES", level=level, session="2026/2027",
                start_date=timezone.localdate(), end_date=timezone.localdate() + timedelta(days=28))
            CohortDepartmentAssignment.objects.create(cohort=cohort, department=self.department,
                coordinator=self.coordinator if level == 300 else None)
            self.cohorts[level] = cohort

    def make_student(self, level):
        user = LogrAccount.objects.create_user(f"level-{level}@example.com", "pass")
        return StudentProfile.objects.create(user=user, matric_no=str(level), department=self.department,
            programme="SIWES", level=level, email_verified=True)

    def test_enrolment_separates_siwes_levels(self):
        from backend.auth.views import try_auto_assign
        third = self.make_student(300)
        fourth = self.make_student(400)
        assign_students(self.cohorts[300])
        try_auto_assign(fourth)
        third.refresh_from_db()
        fourth.refresh_from_db()
        self.assertEqual(third.cohort, self.cohorts[300])
        self.assertEqual(third.coordinator, self.coordinator)
        self.assertEqual(fourth.cohort, self.cohorts[400])
        self.assertIsNone(fourth.coordinator)

    def test_accepting_invite_assigns_only_matching_level(self):
        import secrets
        from backend.auth.models import CoordinatorInvitation
        from .models import CohortDepartmentAssignment
        fourth = self.make_student(400)
        assign_students(self.cohorts[400])
        invitation = CoordinatorInvitation.objects.create(email="fourth-coordinator@example.com",
            department=self.department, programme="SIWES", level=400, token=secrets.token_urlsafe(32))
        response = APIClient().post("/api/v1/invitations/accept/", {
            "token": invitation.token, "first_name": "Fourth", "last_name": "Coordinator",
            "phone": "08012345678", "password": "StrongExample!3427",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        fourth.refresh_from_db()
        self.assertEqual(fourth.coordinator.level, 400)
        self.assertEqual(CohortDepartmentAssignment.objects.get(cohort=self.cohorts[300]).coordinator, self.coordinator)

    def test_wrong_level_coordinator_assignment_is_rejected(self):
        admin = LogrAccount.objects.create_superuser("levels-admin@example.com", "pass")
        client = APIClient()
        client.force_authenticate(admin)
        response = client.patch(f"/api/v1/admin/cohorts/{self.cohorts[400].pk}/departments/{self.department.pk}/coordinator/",
            {"coordinator_id": self.coordinator.pk}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_code_checkin_updates_history_and_coordinator_count(self):
        from .models import CohortDepartmentAssignment
        student = self.make_student(200)
        student.programme = "SWEP"
        self.coordinator.programme = "SWEP"
        self.coordinator.level = 200
        self.coordinator.save()
        cohort = Cohort.objects.create(programme="SWEP", level=200, session="2026/2027",
            start_date=timezone.localdate(), end_date=timezone.localdate() + timedelta(days=28),
            working_days=list(range(7)))
        CohortDepartmentAssignment.objects.create(cohort=cohort, department=self.department, coordinator=self.coordinator)
        student.cohort = cohort
        student.coordinator = self.coordinator
        student.save()
        coordinator_client = APIClient()
        coordinator_client.force_authenticate(self.coordinator_user)
        created = coordinator_client.post("/api/v1/coordinator/attendance/sessions/", {"minutes": 3}, format="json")
        self.assertEqual(created.status_code, 201)
        client = APIClient()
        client.force_authenticate(student.user)
        self.assertFalse(client.get("/api/v1/student/attendance/history/").data["checked_in_today"])
        for expected_status in (201, 200):
            submitted = client.post("/api/v1/student/attendance/", {"code": created.data["code"]}, format="json")
            self.assertEqual(submitted.status_code, expected_status)
        self.assertTrue(client.get("/api/v1/student/attendance/history/").data["checked_in_today"])
        current = coordinator_client.get("/api/v1/coordinator/attendance/sessions/current/")
        self.assertEqual(current.data["present_count"], 1)
        self.assertEqual(current.data["total_students"], 1)
        self.assertEqual(current.data["records"][0]["status"], "present")
