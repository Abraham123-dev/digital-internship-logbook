import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from .email_service import EmailDeliveryError, send_email
from .models import CoordinatorInvitation, CoordinatorProfile, Department, LogrAccount, StudentProfile
from .serializers import (
    AcceptInvitationSerializer,
    EmailSerializer,
    InvitationSerializer,
    LoginSerializer,
    NewPasswordSerializer,
    VerifySerializer,
    PasswordSerializer,
    SignupSerializer,
    CoordinatorProfileSerializer,
    StudentProfileSerializer,
)

logger = logging.getLogger(__name__)
OTP_CACHE_PREFIX = "student-otp-"
PENDING_SIGNUP_CACHE_PREFIX = "pending-student-signup-"
OTP_LIFETIME_SECONDS = 10 * 60
PENDING_SIGNUP_LIFETIME_SECONDS = 24 * 60 * 60


def current_time():
    return timezone.now().isoformat()


def error(code, message, http_status=400):
    return Response({"code": code, "message": message}, status=http_status)


def send_otp_email(email, otp):
    send_email(
        recipient=email,
        subject="Your Logr verification code",
        body=f"Your verification code is {otp}. It expires in 10 minutes.",
    )

def otp_cache_key(email):
    return OTP_CACHE_PREFIX + email


def pending_signup_cache_key(email):
    return PENDING_SIGNUP_CACHE_PREFIX + email


def admin_only(user):
    return user.is_authenticated and user.is_superuser


def sign_out_all_devices(user):
    for token in OutstandingToken.objects.filter(user=user):  # type: ignore[attr-defined]
        BlacklistedToken.objects.get_or_create(token=token)  # type: ignore[attr-defined]


def user_response(user):
    if user.is_superuser:
        role, profile = "ADMIN", None
    elif hasattr(user, "coordinatorprofile"):
        role = "COORDINATOR"
        coordinator = user.coordinatorprofile
        profile = {"department": {"id": coordinator.department_id, "name": coordinator.department.name}}
    elif hasattr(user, "studentprofile"):
        role = "STUDENT"
        student = user.studentprofile
        profile = {
            "matric_no": student.matric_no,
            "department": {"id": student.department_id, "name": student.department.name},
            "programme": student.programme,
            "cohort": {
                "id": student.cohort_id,
                "session": student.cohort.session,
                "start_date": student.cohort.start_date.isoformat(),
                "end_date": student.cohort.end_date.isoformat(),
            } if student.cohort else None,
        }
    else:
        role, profile = "UNKNOWN", None
    return {
        "id": user.id,
        "email": user.email,
        "full_name": " ".join(part for part in (user.first_name, user.last_name) if part),
        "role": role,
        "profile": profile,
    }


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_superuser", False)
        )

class SignupView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"]
        try:
            existing_account = LogrAccount.objects.filter(email__iexact=email).first()
            if existing_account:
                existing_account.delete()
            user = LogrAccount.objects.create_user(
                email=email,
                password=data["password"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                is_active=False,
                role=LogrAccount.Role.STUDENT,
            )
        except IntegrityError:
            return error("email_taken", "An account already uses this email.", 409)

        otp = f"{secrets.randbelow(1_000_000):06d}"
        pending_signup = {
            "matric_no": data["matric_no"],
            "department_id": data["department"].id,
            "programme": data["programme"],
        }
        cache.set(
            pending_signup_cache_key(email),
            pending_signup,
            timeout=PENDING_SIGNUP_LIFETIME_SECONDS,
        )
        try:
            send_otp_email(email, otp)
        except EmailDeliveryError:
            logger.exception("Gmail could not send a student verification code")
            return error("email_delivery_failed", "Account created. Request another code shortly.", 503)
        cache.set(otp_cache_key(email), otp, timeout=OTP_LIFETIME_SECONDS)
        return Response({"message": "Verification code sent.", "email": email}, status=201)


class VerifyOTPView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = VerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        cache_key = otp_cache_key(email)
        saved_otp = cache.get(cache_key)
        pending_signup = cache.get(pending_signup_cache_key(email))
        if not saved_otp or saved_otp != otp or not pending_signup:
            return error("otp_invalid_or_expired", "The code is invalid or expired.")
        try:
            with transaction.atomic():
                user = LogrAccount.objects.get(email__iexact=email, is_active=False)
                department = Department.objects.get(pk=pending_signup["department_id"])
                profile = StudentProfile.objects.create(
                    user=user,
                    matric_no=pending_signup["matric_no"],
                    department=department,
                    programme=pending_signup["programme"],
                    email_verified=True,
                )
                from backend.management.models import Cohort

                cohort = Cohort.objects.filter(
                    department=department,
                    programme=profile.programme,
                    end_date__gte=timezone.localdate(),
                ).order_by("start_date").first()
                if cohort:
                    profile.cohort = cohort
                    profile.coordinator = cohort.coordinator
                    profile.save(update_fields=["cohort", "coordinator"])
                user.is_active = True
                user.save(update_fields=["is_active"])
        except (LogrAccount.DoesNotExist, Department.DoesNotExist):
            return error("signup_expired", "The pending signup could not be found. Please sign up again.")
        except IntegrityError:
            return error("email_or_matric_taken", "An account with this email or matric number already exists.", 409)
        cache.delete(cache_key)
        cache.delete(pending_signup_cache_key(email))
        return Response({"message": "Email verified. Your student profile has been created."})


class ResendOTPView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        pending_key = pending_signup_cache_key(email)
        pending_signup = cache.get(pending_key)
        if pending_signup and LogrAccount.objects.filter(email__iexact=email, is_active=False).exists():
            otp = f"{secrets.randbelow(1_000_000):06d}"
            try:
                send_otp_email(email, otp)
            except EmailDeliveryError:
                #prints the exact error traceback to the console
                logger.exception("Gmail could not resend a student verification code")
                return error("email_delivery_failed", "We could not send the code. Try again shortly.", 503)
            cache.set(otp_cache_key(email), otp, timeout=OTP_LIFETIME_SECONDS)
        return Response({"server_time": current_time(), "message": "If verification is needed, a code has been sent."})


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, admin_login=False):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = authenticate(email=email, password=serializer.validated_data["password"])
        if not user:
            return error("invalid_credentials", "Email or password is incorrect.", 401)
        if admin_login and not user.is_superuser:
            return error("invalid_credentials", "Email or password is incorrect.", 401)
        if not admin_login and not user.is_superuser:
            student_profile = StudentProfile.objects.filter(user=user).first()
            is_student = student_profile is not None
            is_coordinator = CoordinatorProfile.objects.filter(user=user).exists()
            if not is_student and not is_coordinator:
                return error("account_type_invalid", "This account cannot sign in here.", 403)
            if student_profile and not student_profile.email_verified:
                return error("email_not_verified", "Verify your email before signing in.", 403)
        refresh = RefreshToken.for_user(user)
        if user.is_superuser:
            role_claim = "admin"
        elif CoordinatorProfile.objects.filter(user=user).exists():
            role_claim = "coordinator"
        else:
            role_claim = "student"
        refresh["role"] = role_claim
        access = refresh.access_token
        access["role"] = role_claim
        return Response({
                "message": "Login successful",
                "username": user.first_name,
                "role": role_claim,
                "refresh": str(refresh),
                "access": str(access),
            }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({
                "error": "Refresh token is required"
            }, status = status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            try:
                token.blacklist()
            except AttributeError:
                pass
            return Response({
                "message": "Signed out."
                }, status = status.HTTP_200_OK)
        except TokenError as e:
            return Response({
                "error": "Invalid or expired token"
            }, status = status.HTTP_400_BAD_REQUEST)

class AdminLoginView(LoginView):
    #inherits LoginView's behaviour
    permission_classes = [AllowAny]

    def post(self, request, admin_login=True):
        return super().post(request, admin_login=True) #accepts only a superuser account

class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_token = request.data.get("refresh")
        if not raw_token:
            return error("refresh_token_invalid", "Refresh session is missing or expired.", 401)
        try:
            refresh = RefreshToken(raw_token)
            user_id = refresh[jwt_settings.USER_ID_CLAIM]
            user = LogrAccount.objects.get(pk=user_id)
            refresh.blacklist()
        except (TokenError, LogrAccount.DoesNotExist, KeyError):
            return error("refresh_token_invalid", "Refresh session is invalid or expired.", 401)
        if not user.is_active:
            return error("account_deactivated", "This account is inactive.", 403)
        new_refresh = RefreshToken.for_user(user)
        if user.is_superuser:
            role_claim = "admin"
        elif CoordinatorProfile.objects.filter(user=user).exists():
            role_claim = "coordinator"
        else:
            role_claim = "student"
        new_refresh["role"] = role_claim
        new_access = new_refresh.access_token
        new_access["role"] = role_claim
        return Response({
            "server_time": current_time(),
            "role": role_claim,
            "access": str(new_access),
            "refresh": str(new_refresh),
        })

class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = StudentProfile.objects.select_related(
                "user", "department"
            ).get(user=request.user)
        except StudentProfile.DoesNotExist:
            return Response({
                "message": "Profile doesn't exist"
            }, status = status.HTTP_404_NOT_FOUND)

        serializer = StudentProfileSerializer(profile)
        return Response({
            "message": "Profile retrieved successfully",
            "profile": serializer.data
        }, status = status.HTTP_200_OK)

class CoordinatorProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            profile = CoordinatorProfile.objects.select_related(
                "user", "department"
            ).get(user=request.user)
        except CoordinatorProfile.DoesNotExist:
            return Response({
                "message": "Profile doesn't exist"
            }, status = status.HTTP_404_NOT_FOUND)

        serializer = CoordinatorProfileSerializer(profile)
        return Response({
            "message": "Profile retrieved successfully",
            "profile": serializer.data
        }, status = status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return Response({"user": user_response(request.user)})

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = NewPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data["current_password"]):
            return error("current_password_invalid", "Current password is incorrect.")

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({
            "message": "Password successfully changed"
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = LogrAccount.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            token = default_token_generator.make_token(user)
            query = urlencode({"email": user.email, "token": token})
            link = f"{settings.FRONTEND_URL}/reset-password?{query}"
            try:
                send_email(recipient=user.email, subject="Reset your Logr password", body=f"Reset your password: {link}")
            except EmailDeliveryError:
                logger.warning("Gmail could not send a password reset email")
        return Response({"server_time": current_time(), "message": "If the account exists, reset instructions will be sent."})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = LogrAccount.objects.filter(
            email__iexact=serializer.validated_data["email"], is_active=True
        ).first()
        if not user or not default_token_generator.check_token(
            user, serializer.validated_data["token"]
        ):
            return error("reset_token_invalid", "Password reset link is invalid or expired.")
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        return Response({"message": "Password has been reset."})


class InvitationListCreateView(APIView):
    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        if not admin_only(request.user):
            return error("permission_denied", "Admin access is required.", 403)
        invitations = CoordinatorInvitation.objects.select_related("department").order_by("-created_at")[:100]
        return Response({"server_time": current_time(), "results": [
            {"id": item.id, "email": item.email, "department": item.department.name,
             "programme": item.programme,
             "status": "EXPIRED" if item.status == "PENDING" and item.is_expired else item.status,
             "expires_at": item.expires_at.isoformat()}
            for item in invitations
        ]})

    def post(self, request):
        if not admin_only(request.user):
            return error("permission_denied", "Admin access is required.", 403)
        serializer = InvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = secrets.token_urlsafe(32)
        invitation = CoordinatorInvitation.objects.create(
            email=serializer.validated_data["email"],
            department=serializer.validated_data["department"],
            programme=serializer.validated_data["programme"],
            token=token,
            expires_at=timezone.now() + timedelta(hours=72),
        )
        try:
            send_invitation_email(invitation)
        except EmailDeliveryError:
            logger.warning("Gmail could not send a coordinator invitation")
            return error("email_delivery_failed", f"Invitation {invitation.id} was created but email could not be sent.", 503)
        return Response({"server_time": current_time(), "id": invitation.id, "status": "PENDING"}, status=201)


def send_invitation_email(invitation):
    link = f"{settings.FRONTEND_URL}/accept-invite?token={invitation.token}"
    send_email(
        recipient=invitation.email,
        subject="You're invited to Logr",
        body=f"You are invited to coordinate {invitation.department.name} ({invitation.programme}). Accept within 72 hours: {link}",
    )


class InvitationManageView(APIView):
    permission_classes = [IsAdmin]
    authentication_classes = [JWTAuthentication]

    def post(self, request, invitation_id):
        if not admin_only(request.user):
            return error("permission_denied", "Admin access is required.", 403)
        invitation = CoordinatorInvitation.objects.filter(pk=invitation_id, status="PENDING").first()
        if not invitation or invitation.is_expired:
            return error("invitation_invalid", "Invitation is invalid or expired.")
        invitation.token = secrets.token_urlsafe(32)
        invitation.expires_at = timezone.now() + timedelta(hours=72)
        invitation.save(update_fields=["token", "expires_at"])
        try:
            send_invitation_email(invitation)
        except EmailDeliveryError:
            return error("email_delivery_failed", "Invitation was updated but email could not be sent.", 503)
        return Response({"server_time": current_time(), "message": "Invitation resent."})

    def delete(self, request, invitation_id):
        if not admin_only(request.user):
            return error("permission_denied", "Admin access is required.", 403)
        invitation = CoordinatorInvitation.objects.filter(pk=invitation_id, status="PENDING").first()
        if not invitation:
            return error("invitation_not_found", "Pending invitation was not found.", 404)
        invitation.status = "REVOKED"
        invitation.save(update_fields=["status"])
        return Response({"server_time": current_time(), "message": "Invitation revoked."})


class ValidateInvitationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        invitation = CoordinatorInvitation.objects.select_related("department").filter(
            token=request.query_params.get("token", ""), status="PENDING"
        ).first()
        if not invitation or invitation.is_expired:
            return error("invitation_invalid", "Invitation is invalid or expired.")
        return Response({"server_time": current_time(), "email": invitation.email,
                         "department": invitation.department.name,
                         "programme": invitation.programme,
                         "expires_at": invitation.expires_at.isoformat()})


class AcceptInvitationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AcceptInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                invitation = CoordinatorInvitation.objects.select_for_update().select_related("department").filter(
                    token=serializer.validated_data["token"], status="PENDING"
                ).first()
                if not invitation or invitation.is_expired:
                    return error("invitation_invalid", "Invitation is invalid or expired.")
                if LogrAccount.objects.filter(email__iexact=invitation.email).exists():
                    return error("email_taken", "An account already uses this email.", 409)
                user = LogrAccount.objects.create_user(
                    email=invitation.email,
                    password=serializer.validated_data["password"],
                    first_name=serializer.validated_data["first_name"],
                    last_name=serializer.validated_data["last_name"],
                    role=LogrAccount.Role.COORDINATOR,
                )
                CoordinatorProfile.objects.create(
                    user=user,
                    department=invitation.department,
                    programme=invitation.programme,
                    phone=serializer.validated_data["phone"],
                )
                invitation.status = "ACCEPTED"
                invitation.save(update_fields=["status"])
        except IntegrityError:
            return error("invitation_used", "Invitation has already been used.", 409)
        refresh = RefreshToken.for_user(user)
        refresh["role"] = "coordinator"
        access = refresh.access_token
        access["role"] = "coordinator"
        return Response({
            "server_time": current_time(),
            "user": user_response(user),
            "role": "coordinator",
            "access": str(access),
            "refresh": str(refresh),
        }, status=201)
