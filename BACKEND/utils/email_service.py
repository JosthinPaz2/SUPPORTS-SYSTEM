import os
import logging
from typing import Optional
from email.message import EmailMessage

import aiosmtplib

logger = logging.getLogger("email_service")


def _get_smtp_config() -> tuple[str, int, str, str]:
    """Read SMTP configuration from environment.

    The code prefers SMTP_* variables but will fall back to the old
    MAIL_* names that are referenced in the README.  This way changing the
    `.env` values once will affect every part of the app.
    """
    host = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER")
    port = int(os.getenv("SMTP_PORT", os.getenv("MAIL_PORT", "587")))
    user = os.getenv("SMTP_USER") or os.getenv("MAIL_FROM")
    password = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    return host, port, user, password


async def _send_email(subject: str, recipient: str, body: str) -> bool:
    """Utility that sends a plain-text email using SMTP settings from env."""
    host, port, user, password = _get_smtp_config()

    if not host or not user or not password:
        logger.error("SMTP configuration incomplete, skipping email to %s", recipient)
        return False

    message = EmailMessage()
    message["From"] = user
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    try:
        smtp = aiosmtplib.SMTP(hostname=host, port=port, start_tls=True)
        await smtp.connect()
        await smtp.login(user, password)
        await smtp.send_message(message)
        await smtp.quit()
        logger.info("Email sent to %s via %s", recipient, host)
        return True
    except Exception as e:
        logger.exception("Failed sending email to %s: %s", recipient, e)
        return False


async def send_recovery_email(email: str, code: str, nombre: Optional[str] = None) -> bool:
    """Send password recovery code to the user.

    The message includes the 6‑digit code and a brief explanation.
    """
    if os.getenv("DISABLE_EMAILS", "false").lower() == "true":
        logger.info("Emails disabled, skipping recovery email to %s", email)
        return True
    
    subject = "[Soporte Técnico] Código de recuperación"
    name_part = f" {nombre}" if nombre else ""
    body = (
        f"Hola{name_part},\n\n" 
        f"Has solicitado recuperar tu contraseña. Tu código de recuperación es: {code}\n\n"
        "Si no solicitaste este código, ignora este mensaje."
    )
    return await _send_email(subject, email, body)


async def send_welcome_email(email: str, nombre: Optional[str] = None) -> bool:
    """Send a welcome email after successful registration."""
    if os.getenv("DISABLE_EMAILS", "false").lower() == "true":
        logger.info("Emails disabled, skipping welcome email to %s", email)
        return True
    
    subject = "Bienvenido al sistema de soporte técnico"
    name_part = f" {nombre}" if nombre else ""
    body = (
        f"Hola{name_part},\n\n" 
        "Gracias por registrarte en el sistema de soporte técnico.\n" 
        "Puedes comenzar a usar tu cuenta inmediatamente.\n\n"
        "Saludos."
    )
    return await _send_email(subject, email, body)
