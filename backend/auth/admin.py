from django.contrib import admin

from .models import CoordinatorProfile, Department, LogrAccount, StudentProfile


admin.site.register(Department)
admin.site.register(StudentProfile)
admin.site.register(CoordinatorProfile)


@admin.register(LogrAccount)
class LogrAccountAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name")
