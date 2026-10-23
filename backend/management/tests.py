from datetime import date, timedelta
from io import StringIO
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from django.core.management import call_command
from rest_framework.test import APIClient

from backend.auth.models import CoordinatorProfile, Department, LogrAccount, Programme, StudentProfile
from .models import Cohort, ExtensionRequest, SupervisorDetails, WeeklySubmission
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
