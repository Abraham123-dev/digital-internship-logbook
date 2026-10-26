from django.db import migrations


def seed_faculties_departments(apps, schema_editor):
    Faculty = apps.get_model("accounts", "Faculty")
    Department = apps.get_model("accounts", "Department")
    DegreeProgramme = apps.get_model("accounts", "DegreeProgramme")

    # Faculty of Computer Science & Engineering
    fcse = Faculty.objects.create(
        name="Faculty of Computer Science & Engineering",
        code="FCSE",
    )

    # The whole faculty is one department unit
    cse_dept, _ = Department.objects.get_or_create(
        name="Computer Science & Engineering",
        defaults={"faculty": fcse},
    )
    if cse_dept.faculty_id is None:
        cse_dept.faculty = fcse
        cse_dept.save(update_fields=["faculty"])

    # Degree programmes that live in FCSE
    for dp_name in [
        "Computer Science with Mathematics",
        "Computer Science with Economics",
        "Computer Engineering",
        "Software Engineering",
        "Information & Communication Technology",
        "Information Science",
    ]:
        DegreeProgramme.objects.get_or_create(name=dp_name, faculty=fcse)

    # Faculty of Technology
    ftech = Faculty.objects.create(
        name="Faculty of Technology",
        code="FTECH",
    )

    for dept_name in [
        "Electrical & Electronic Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Agricultural & Environmental Engineering",
        "Materials Science & Engineering",
        "Food Science & Technology",
    ]:
        dept, _ = Department.objects.get_or_create(
            name=dept_name,
            defaults={"faculty": ftech},
        )
        if dept.faculty_id is None:
            dept.faculty = ftech
            dept.save(update_fields=["faculty"])


def unseed_faculties_departments(apps, schema_editor):
    Faculty = apps.get_model("accounts", "Faculty")
    Faculty.objects.filter(code__in=["FCSE", "FTECH"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_degreeprogramme_faculty_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_faculties_departments, unseed_faculties_departments),
    ]
