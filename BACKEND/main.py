from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import re
import urllib.parse
from dotenv import load_dotenv  # Para cargar variables de entorno

from controllers.category_controller import router as category_router
from controllers.comment_controller import router as comment_router
from controllers.station_controller import router as station_router
from controllers.notification_controller import router as notification_router
from controllers.role_controller import router as role_router
from controllers.ticket_controller import router as ticket_router
from controllers.user_controller import router as user_router
from controllers.zone_controller import router as zone_router
from controllers.location_controller import router as location_router
from controllers.change_history_controller import router as change_router

# Importar Base y engine para crear las tablas al iniciar la app
from db import Base, engine

# --- Crear la instancia de la aplicación FastAPI ---
# Esta es la línea que inicializa tu aplicación.
app = FastAPI()

# Cargar variables de entorno
load_dotenv()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # URLs del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request



# --- Inclusión de todas las rutas de la API ---
app.include_router(category_router)
app.include_router(user_router)
app.include_router(role_router)
app.include_router(zone_router)
app.include_router(location_router)
app.include_router(station_router)
app.include_router(ticket_router)
app.include_router(comment_router)
app.include_router(notification_router)
app.include_router(change_router)


# Crear tablas al iniciar la aplicación (si no existen)
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # No bloquear el arranque si hay problemas con la BD; se mostrará el error en logs
        pass


# Si ejecutas el archivo directamente, arranca Uvicorn usando el puerto
# que asigne la plataforma (variable de entorno PORT).
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
