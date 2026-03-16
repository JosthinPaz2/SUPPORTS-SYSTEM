from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
from utils.security import decode_access_token_payload, has_path_access

def _has_segment(path: str, segment: str) -> bool:
    parts = [p for p in (path or "").lower().split("/") if p]
    return segment.lower() in parts

class RBACMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Proteger cualquier ruta que contenga /admin o /employee
        if not (_has_segment(path, "admin") or _has_segment(path, "employee")):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Falta token Bearer"})

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = decode_access_token_payload(token)
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Token inválido o expirado"})

        allowed, reason = has_path_access(path, payload)
        if not allowed:
            return JSONResponse(status_code=403, content={"detail": reason})

        return await call_next(request)