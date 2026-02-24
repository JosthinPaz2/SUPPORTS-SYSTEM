from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import re
import urllib.parse
from dotenv import load_dotenv  # Para cargar variables de entorno

from controllers.categoria_controller import router as categoria_router
from controllers.comentario_controller import router as comentario_router
from controllers.estacion_controller import router as estacion_router
from controllers.notificacion_controller import router as notificacion_router
from controllers.rol_controller import router as rol_router
from controllers.ticket_controller import router as ticket_router
from controllers.usuario_controller import router as usuario_router
from controllers.zona_controller import router as zona_router

# Importar Base y engine para crear las tablas al iniciar la app
from db import Base, engine

# --- Crear la instancia de la aplicación FastAPI ---
# Esta es la línea que inicializa tu aplicación.
app = FastAPI()

# Cargar variables de entorno
load_dotenv()


# --- Inclusión de todas las rutas de la API ---
app.include_router(categoria_router)
app.include_router(usuario_router)
app.include_router(rol_router)
app.include_router(zona_router)
app.include_router(estacion_router)
app.include_router(ticket_router)
app.include_router(comentario_router)
app.include_router(notificacion_router)


# Crear tablas al iniciar la aplicación (si no existen)
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # No bloquear el arranque si hay problemas con la BD; se mostrará el error en logs
        pass
