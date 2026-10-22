import base64
from email.message import EmailMessage

from django.conf import settings
from google.auth.transport.requests import Request
from google_auth_httplib2 import AuthorizedHttp
import httplib2
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


class EmailDeliveryError(Exception):
    """Raised when the configured Gmail sender cannot deliver a message."""


def send_email(*, recipient, subject, body):
    required = (settings.GMAIL_CLIENT_ID, settings.GMAIL_CLIENT_SECRET,
                settings.GMAIL_REFRESH_TOKEN, settings.GMAIL_SENDER_EMAIL)
    if not all(required):
        raise EmailDeliveryError("Gmail sender credentials are not configured")

    credentials = Credentials(
        token=None,
        refresh_token=settings.GMAIL_REFRESH_TOKEN,
        token_uri=settings.GMAIL_TOKEN_URI,
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.send"],
    )
    try:
        credentials.refresh(Request(timeout=10))
        message = EmailMessage()
        message["To"] = recipient
        message["From"] = settings.GMAIL_SENDER_EMAIL
        message["Subject"] = subject
        message.set_content(body)
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
        http = AuthorizedHttp(credentials, http=httplib2.Http(timeout=10))
        service = build("gmail", "v1", http=http, cache_discovery=False)
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
    except Exception as exc:
        raise EmailDeliveryError("Gmail could not deliver the message") from exc
