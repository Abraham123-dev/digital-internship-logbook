from datetime import timedelta

from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone


def invitation_expiry():
    return timezone.now() + timedelta(hours=72)

class Programme(models.TextChoices):
    SWEP = "SWEP", "SWEP"
    SIWES = "SIWES", "SIWES"


class AccountManager(BaseUserManager):
    """Create accounts using email instead of a separate username."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        account = self.model(email=self.normalize_email(email).lower(), **extra_fields)
        account.set_password(password)
        account.save(using=self._db)
        return account

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class LogrAccount(AbstractBaseUser):
    """The project's shared account model; email is the login identifier."""
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        COORDINATOR = "COORDINATOR", "Coordinator"
        ADMINISTRATOR = "ADMINISTRATOR", "Administrator"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DEACTIVATED = "DEACTIVATED", "Deactivated"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"
        RUSTICATED = "RUSTICATED", "Rusticated"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    role = models.CharField(max_length=20, default="STUDENT", choices=Role.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    status_reason = models.CharField(max_length=100, blank=True)
    status_note = models.TextField(blank=True)

    objects = AccountManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_active and self.is_staff and self.is_superuser

    def has_module_perms(self, app_label):
        return self.has_perm(None)


class Faculty(models.Model):
    """Top-level academic unit that groups departments (e.g. Faculty of Technology)."""
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)  # e.g. "FTECH", "FCSE"

    def __str__(self):
        return self.name


class Department(models.Model):
    """One shared department list keeps student and coordinator assignments consistent."""

    id: int
    name = models.CharField(max_length=150, unique=True)
    faculty = models.ForeignKey(
        Faculty, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="departments"
    )
    objects = models.Manager()

    def __str__(self):
        return self.name


class DegreeProgramme(models.Model):
    """Specific course of study within a faculty (e.g. Software Engineering, CS with Maths)."""
    name = models.CharField(max_length=150)
    faculty = models.ForeignKey(
        Faculty, on_delete=models.PROTECT, related_name="degree_programmes"
    )

    class Meta:
        unique_together = [("name", "faculty")]

    def __str__(self):
        return f"{self.name} ({self.faculty.code})"


class StudentProfile(models.Model):
    id: int
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    matric_no = models.CharField(max_length=40, unique=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    degree_programme = models.ForeignKey(
        DegreeProgramme, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="students",
    )
    programme = models.CharField(max_length=10, choices=Programme.choices)
    email_verified = models.BooleanField(default=False)

    objects = models.Manager()
    cohort = models.ForeignKey(
        "management.Cohort",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="students",
    )
    coordinator = models.ForeignKey(
        "accounts.CoordinatorProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="students",
    )

    def __str__(self):
        #to help define the field used to identify a particular profile table on django admin
        return self.user.email


class CoordinatorProfile(models.Model):
    id: int
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    programme = models.CharField(max_length=10, choices=Programme.choices)
    objects = models.Manager()

    def __str__(self):
        return self.user.email

class CoordinatorInvitation(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        EXPIRED = "EXPIRED", "Expired"
        REVOKED = "REVOKED", "Revoked"

    id: int
    email = models.EmailField()
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    programme = models.CharField(max_length=10, choices=Programme.choices)
    token = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=invitation_expiry)
    objects = models.Manager()

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
