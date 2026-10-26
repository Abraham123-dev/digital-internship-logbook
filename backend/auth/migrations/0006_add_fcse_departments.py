from django.db import migrations


def add_fcse_departments(apps, schema_editor):
    Faculty = apps.get_model("accounts", "Faculty")
    Department = apps.get_model("accounts", "Department")

    fcse = Faculty.objects.filter(code="FCSE").first()
    if not fcse:
        fcse = Faculty.objects.create(
            name="Faculty of Computer Science & Engineering",
            code="FCSE",
        )

    fcse_departments = [
        "Computer Science with Mathematics",
        "Computer Science with Economics",
        "Computer Engineering",
        "Software Engineering",
        "Information & Communication Technology",
        "Information Science",
    ]

    for dept_name in fcse_departments:
        dept, created = Department.objects.get_or_create(
            name=dept_name,
            defaults={"faculty": fcse},
        )
        if dept.faculty_id != fcse.id:
            dept.faculty = fcse
            dept.save(update_fields=["faculty"])


def remove_fcse_departments(apps, schema_editor):
    Department = apps.get_model("accounts", "Department")
    Department.objects.filter(name__in=[
        "Computer Science with Mathematics",
        "Computer Science with Economics",
        "Computer Engineering",
        "Software Engineering",
        "Information & Communication Technology",
        "Information Science",
    ]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_seed_faculties_departments"),
    ]

    operations = [
        migrations.RunPython(add_fcse_departments, remove_fcse_departments),
    ]
