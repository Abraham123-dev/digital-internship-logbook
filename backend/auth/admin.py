from django.contrib import admin

from .models import CoordinatorInvitation, CoordinatorProfile, Department, LogrAccount, StudentProfile

#django admin only registers database models and not textchoices
admin.site.register(Department)
admin.site.register(StudentProfile)
admin.site.register(CoordinatorProfile)
admin.site.register(CoordinatorInvitation)


@admin.register(LogrAccount)
class LogrAccountAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name", "is_staff", "is_active", "role")
    search_fields = ("email", "first_name", "last_name")
