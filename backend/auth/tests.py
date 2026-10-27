from django.test import TestCase, SimpleTestCase
from .email_service import render_email_card
from .models import Department
from .serializers import InvitationSerializer


class TrainingInvitationValidationTests(TestCase):
    def test_siwes_requires_level_and_swep_uses_200(self):
        department = Department.objects.create(name="Invitation Department")
        data = {"email": "invite@example.com", "department_id": department.pk, "programme": "SIWES"}
        serializer = InvitationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("level", serializer.errors)
        for level in (300, 400):
            serializer = InvitationSerializer(data={**data, "level": level})
            self.assertTrue(serializer.is_valid(), serializer.errors)
            self.assertEqual(serializer.validated_data["level"], level)
        serializer = InvitationSerializer(data={**data, "programme": "SWEP"})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["level"], 200)


class EmailCardTests(SimpleTestCase):
    def test_invitation_link_is_a_button_and_content_is_escaped(self):
        from html.parser import HTMLParser
        html = render_email_card("Logr invitation", "Hello <script>alert(1)</script>\nAccept: https://example.com/accept-invite?token=abc")
        self.assertIn('href="https://example.com/accept-invite?token=abc"', html)
        self.assertIn("Accept invitation", html)
        self.assertNotIn("<script>", html)
        class TextCollector(HTMLParser):
            text = ""
            def handle_data(self, data):
                self.text += data
        parser = TextCollector()
        parser.feed(html)
        self.assertNotIn("https://example.com", parser.text)
