"""Run once locally to authorize the shared Gmail sender OAuth client."""

from google_auth_oauthlib.flow import InstalledAppFlow


SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


def main():
    flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
    credentials = flow.run_local_server(port=0, access_type="offline", prompt="consent")
    if not credentials.refresh_token:
        raise SystemExit("Google returned no refresh token. Revoke prior app access and authorize again.")
    print("Copy this refresh token to GMAIL_REFRESH_TOKEN in your private environment:")
    print(credentials.refresh_token)


if __name__ == "__main__":
    main()
