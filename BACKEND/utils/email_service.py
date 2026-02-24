import os
import logging
from typing import Optional

logger = logging.getLogger("email_service")


async def send_recovery_email(email: str, code: str, nombre: Optional[str] = None) -> bool:
    """Stub: enviar email de recuperación. Devuelve True si 'enviado'.

    Puedes reemplazar esta implementación por `fastapi-mail` o la librería
    SMTP que prefieras y usar variables de entorno para configuración.
    """
    try:
        # TODO: Integrar con un servicio real (FastAPI-Mail, SMTP, etc.)
        logger.info("Enviar código %s a %s (simulado)", code, email)
        return True
    except Exception as e:
        logger.exception("Error enviando email de recuperación: %s", e)
        return False


async def send_welcome_email(email: str, nombre: Optional[str] = None) -> bool:
    try:
        logger.info("Enviar email de bienvenida a %s (simulado)", email)
        return True
    except Exception as e:
        logger.exception("Error enviando email de bienvenida: %s", e)
        return False
