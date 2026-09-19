import os

from dotenv import load_dotenv
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "EchoMind")
EMAIL_FROM_EMAIL = os.getenv("EMAIL_FROM_EMAIL")

if not BREVO_API_KEY:
    raise ValueError("BREVO_API_KEY is not set in the .env file")

if not EMAIL_FROM_EMAIL:
    raise ValueError("EMAIL_FROM_EMAIL is not set in the .env file")


async def send_password_reset_email(
    recipient_email: str,
    reset_url: str,
):
    configuration = sib_api_v3_sdk.Configuration()

    configuration.api_key["api-key"] = BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your EchoMind password</title>
    </head>

    <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f7fb;
        font-family: Arial, Helvetica, sans-serif;
    ">

        <div style="
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-sizing: border-box;
        ">

            <h1 style="
                margin: 0 0 10px;
                color: #111827;
                font-size: 30px;
            ">
                EchoMind
            </h1>

            <h2 style="
                color: #374151;
                font-size: 22px;
                margin-bottom: 20px;
            ">
                Password Reset
            </h2>

            <p style="
                color: #4b5563;
                font-size: 16px;
                line-height: 1.6;
            ">
                We received a request to reset your EchoMind password.
            </p>

            <p style="
                color: #4b5563;
                font-size: 16px;
                line-height: 1.6;
            ">
                Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="
                    display: inline-block;
                    background-color: #4f46e5;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                ">
                    Reset Password
                </a>
            </div>

            <p style="
                color: #6b7280;
                font-size: 14px;
                line-height: 1.6;
            ">
                This password reset link will expire in 15 minutes.
            </p>

            <p style="
                color: #6b7280;
                font-size: 14px;
                line-height: 1.6;
            ">
                If you did not request a password reset, you can safely ignore
                this email.
            </p>

            <hr style="
                border: none;
                border-top: 1px solid #e5e7eb;
                margin: 30px 0;
            ">

            <p style="
                color: #9ca3af;
                font-size: 13px;
                text-align: center;
            ">
                © EchoMind
            </p>

        </div>

    </body>
    </html>
    """

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        sender={
            "name": EMAIL_FROM_NAME,
            "email": EMAIL_FROM_EMAIL,
        },
        to=[
            {
                "email": recipient_email,
            }
        ],
        subject="Reset your EchoMind password",
        html_content=html_content,
    )

    try:
        response = api_instance.send_transac_email(send_smtp_email)

        print(
            f"✅ Password reset email sent to {recipient_email}"
        )

        return response

    except ApiException as exc:
        print(f"❌ Brevo email error: {exc}")

        raise RuntimeError(
            f"Failed to send password reset email: {exc}"
        ) from exc