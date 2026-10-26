from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from rest_framework import serializers

from .models import CoordinatorInvitation, CoordinatorProfile, Department, LogrAccount, Programme, StudentProfile


def normalize_email(email):
    return email.strip().lower()


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    matric_no = serializers.CharField(max_length=40)
    email = serializers.EmailField()
    department_id = serializers.PrimaryKeyRelatedField(
        source="department", queryset=Department.objects.all()
    )
    programme = serializers.ChoiceField(choices=Programme.choices)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        email = normalize_email(value)
        domains = [domain.lower() for domain in settings.STUDENT_EMAIL_DOMAINS]
        if email.rsplit("@", 1)[-1] not in domains:
            raise serializers.ValidationError("Use an approved student email domain.")
        existing_account = LogrAccount.objects.filter(email__iexact=email).first()
        if existing_account and (
            existing_account.is_active
            or existing_account.is_superuser
            or hasattr(existing_account, "studentprofile")
            or hasattr(existing_account, "coordinatorprofile")
        ):
            raise serializers.ValidationError("This email is already registered.")
        if CoordinatorInvitation.objects.filter(
            email__iexact=email, status="PENDING", expires_at__gt=timezone.now()
        ).exists():
            raise serializers.ValidationError("This email has a pending coordinator invitation.")
        return email

    def validate_matric_no(self, value):
        value = value.strip()
        if StudentProfile.objects.filter(matric_no__iexact=value).exists():
            raise serializers.ValidationError("This matric number is already registered.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value


class VerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.RegexField(r"^\d{6}$")

    def validate_email(self, value):
        return normalize_email(value)


OTPSerializer = VerifySerializer


class LogrAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogrAccount
        fields = ["email", "first_name", "last_name", "role"]

class StudentProfileSerializer(serializers.ModelSerializer):
    account = LogrAccountSerializer(source="user", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)
    faculty = serializers.CharField(source="department.faculty.name", read_only=True, default=None)

    class Meta:
        model = StudentProfile
        fields = ["account", "matric_no", "department", "faculty", "programme", "email_verified"]

class CoordinatorProfileSerializer(serializers.ModelSerializer):
    account = LogrAccountSerializer(source="user", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)
    faculty = serializers.CharField(source="department.faculty.name", read_only=True, default=None)
    enrolled_students = serializers.SerializerMethodField()
    active_cohort = serializers.SerializerMethodField()

    class Meta:
        model = CoordinatorProfile
        fields = ["account", "department", "faculty", "programme", "phone", "enrolled_students", "active_cohort"]

    def get_enrolled_students(self, obj):
        return StudentProfile.objects.filter(
            models.Q(coordinator=obj) | models.Q(cohort__coordinator=obj)
        ).distinct().count()

    def get_active_cohort(self, obj):
        from backend.management.models import Cohort
        cohort = Cohort.objects.filter(coordinator=obj).order_by("-start_date").first()
        return cohort.session if cohort else None

class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return normalize_email(value)


class LoginSerializer(EmailSerializer): #inherits the email field and validation function in Email Serializer
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordSerializer(EmailSerializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value


class NewPasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only = True)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value


class InvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    department_id = serializers.PrimaryKeyRelatedField(
        source="department", queryset=Department.objects.all()
    )
    programme = serializers.ChoiceField(choices=Programme.choices)

    def validate_email(self, value):
        email = normalize_email(value)
        if LogrAccount.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account already uses this email.")
        if CoordinatorInvitation.objects.filter(email__iexact=email, status="PENDING").exists():
            raise serializers.ValidationError("A pending invitation already exists.")
        return email


class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.CharField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value
