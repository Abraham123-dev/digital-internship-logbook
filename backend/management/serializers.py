from rest_framework import serializers

from backend.auth.models import Programme
from .models import (
    AttendanceRecord,
    Cohort,
    CohortHoliday,
    EntryReview,
    LogbookEntry,
    SupervisorDetails,
    SupervisorReview,
)


class CohortSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", read_only=True)
    coordinator = serializers.CharField(source="coordinator.user.email", read_only=True)
    status = serializers.CharField(read_only=True)
    total_weeks = serializers.IntegerField(read_only=True)
    holidays = serializers.ListField(
        child=serializers.DateField(), required=False, write_only=True
    )
    holiday_dates = serializers.SerializerMethodField()

    class Meta:
        model = Cohort
        fields = [
            "id", "department", "coordinator", "programme", "session",
            "start_date", "end_date", "working_days", "deadline_weekday",
            "deadline_time", "max_grace_days", "request_window_days",
            "max_extensions_per_week", "correction_days", "min_filled_chars",
            "attendance_max_minutes", "attendance_max_codes_per_day",
            "missed_weeks_count_as_zero", "holidays", "holiday_dates", "status", "total_weeks",
        ]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({"end_date": "End date must be after the start date."})

        working_days = attrs.get("working_days", getattr(self.instance, "working_days", [0, 1, 2, 3, 4]))
        if not working_days or any(day not in range(7) for day in working_days):
            raise serializers.ValidationError({"working_days": "Choose at least one valid weekday (0 to 6)."})

        max_grace_days = attrs.get("max_grace_days", getattr(self.instance, "max_grace_days", 7))
        if max_grace_days < 1 or max_grace_days > 14:
            raise serializers.ValidationError({"max_grace_days": "Choose between 1 and 14 days."})
 
        max_minutes = attrs.get("attendance_max_minutes", getattr(self.instance, "attendance_max_minutes", 3))
        if max_minutes < 1 or max_minutes > 3:
            raise serializers.ValidationError({"attendance_max_minutes": "Choose between 1 and 3 minutes."})

        holiday_dates = attrs.get("holidays", [])
        if len(holiday_dates) != len(set(holiday_dates)):
            raise serializers.ValidationError({"holidays": "A holiday date can only be listed once."})
        if start_date and end_date and any(day < start_date or day > end_date for day in holiday_dates):
            raise serializers.ValidationError({"holidays": "Each holiday must be within the cohort dates."})

        return attrs

    def get_holiday_dates(self, cohort):
        return list(cohort.holidays.order_by("date").values_list("date", flat=True))

    def create(self, validated_data):
        holiday_dates = validated_data.pop("holidays", [])
        cohort = Cohort.objects.create(**validated_data)
        CohortHoliday.objects.bulk_create([
            CohortHoliday(cohort=cohort, date=day) for day in holiday_dates
        ])
        return cohort

    def update(self, instance, validated_data):
        holiday_dates = validated_data.pop("holidays", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if holiday_dates is not None:
            instance.holidays.exclude(date__in=holiday_dates).delete()
            existing_dates = set(instance.holidays.values_list("date", flat=True))
            CohortHoliday.objects.bulk_create([
                CohortHoliday(cohort=instance, date=day)
                for day in holiday_dates
                if day not in existing_dates
            ])
        return instance


class CohortHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = CohortHoliday
        fields = ["id", "date", "label"]


class AttendanceSessionCreateSerializer(serializers.Serializer):
    minutes = serializers.IntegerField(min_value=1, max_value=3, required=False, default=3)


class AttendanceCodeSerializer(serializers.Serializer):
    code = serializers.RegexField(r"^[A-HJ-NP-Z2-9]{6}$")


class AttendanceOverrideSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        (AttendanceRecord.Status.PRESENT, "Present"),
        (AttendanceRecord.Status.EXCUSED, "Excused"),
    ])
    reason = serializers.CharField(max_length=300, allow_blank=False)


class EntryReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ReturnWeekSerializer(serializers.Serializer):
    comment = serializers.CharField(min_length=1, max_length=1000)


class ExtensionRequestSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=10, max_length=500)


class ExtensionDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=[("APPROVED", "Approved"), ("REJECTED", "Rejected")])
    days = serializers.IntegerField(min_value=1, required=False)
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["decision"] == "APPROVED" and "days" not in attrs:
            raise serializers.ValidationError({"days": "Choose how many extra days to allow."})
        if attrs["decision"] == "REJECTED" and not attrs.get("comment", "").strip():
            raise serializers.ValidationError({"comment": "Add a reason for rejecting the request."})
        return attrs


class DayEntrySerializer(serializers.Serializer):
    activities = serializers.CharField(max_length=5000, allow_blank=True)
    skills = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    review_text = serializers.CharField(max_length=2000, required=False, allow_blank=True)

    def validate_activities(self, value):
        from django.utils.html import strip_tags

        return strip_tags(value).strip()

    def validate_skills(self, value):
        from django.utils.html import strip_tags

        return strip_tags(value).strip()

    def validate_review_text(self, value):
        from django.utils.html import strip_tags

        return strip_tags(value).strip()


class SupervisorDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisorDetails
        fields = ["name", "email", "phone", "organisation"]
        extra_kwargs = {"organisation": {"required": False, "allow_blank": True}}

    def validate_phone(self, value):
        value = value.strip().replace(" ", "")
        if not value.startswith("+") or not value[1:].isdigit():
            raise serializers.ValidationError("Use an international phone number beginning with +.")
        return value


class SupervisorReviewSubmitSerializer(serializers.Serializer):
    review_text = serializers.CharField(min_length=20, max_length=4000)
    signature_type = serializers.ChoiceField(choices=[("TYPED", "Typed"), ("DRAWN", "Drawn")])
    signed_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    signature_data = serializers.CharField(required=False, allow_blank=True, max_length=300000)
    confirm_signature = serializers.BooleanField()

    def validate(self, attrs):
        if not attrs.get("confirm_signature"):
            raise serializers.ValidationError({"confirm_signature": "Confirm that this signature is yours."})
        if attrs["signature_type"] == "TYPED" and not attrs.get("signed_name", "").strip():
            raise serializers.ValidationError({"signed_name": "Enter your full name as your signature."})
        if attrs["signature_type"] == "DRAWN" and not attrs.get("signature_data"):
            raise serializers.ValidationError({"signature_data": "Provide the PNG signature data."})
        if attrs["signature_type"] == "DRAWN":
            import base64
            import binascii

            prefix = "data:image/png;base64,"
            value = attrs["signature_data"]
            if not value.startswith(prefix):
                raise serializers.ValidationError({"signature_data": "Send the signature as a PNG data URL."})
            try:
                image_bytes = base64.b64decode(value[len(prefix):], validate=True)
            except (binascii.Error, ValueError):
                raise serializers.ValidationError({"signature_data": "The signature image is not valid base64."})
            if len(image_bytes) > 100_000:
                raise serializers.ValidationError({"signature_data": "The signature must be smaller than 100 KB."})
            if not image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                raise serializers.ValidationError({"signature_data": "The signature must be a PNG image."})
        return attrs


class AccountStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        ("DEACTIVATED", "Deactivated"),
        ("WITHDRAWN", "Withdrawn"),
        ("RUSTICATED", "Rusticated"),
    ])
    reason = serializers.CharField(max_length=100)
    note = serializers.CharField(max_length=1000)


class ProgrammeSerializer(serializers.Serializer):
    programme = serializers.ChoiceField(choices=Programme.choices)

