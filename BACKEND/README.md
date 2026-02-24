# Sistema de Gestión de Soporte Técnico

Un API REST completo construido con **FastAPI** para la gestión integrada de tickets de soporte técnico, incluyendo gestión de usuarios, estaciones, zonas, categorías, prioridades, comentarios y notificaciones.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Migraciones de Base de Datos](#migraciones-de-base-de-datos)
- [Ejecutar el Proyecto](#ejecutar-el-proyecto)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- **Python 3.12 o superior** - [Descargar Python](https://www.python.org/downloads/)
- **pip** (gestor de paquetes de Python) - Viene incluido con Python
- **MySQL/MariaDB** - [Descargar MariaDB](https://mariadb.org/download/)
- **Git** (opcional, para clonar el repositorio)

### Verificar Instalación

```bash
python --version
pip --version
mysql --version  # o mariadb --version
```

---

## 📦 Instalación

### 1. Clonar o Descargar el Proyecto

```bash
# Si tienes Git
git clone <url-del-repositorio>
cd BACKEND

# O simplemente navega a la carpeta del proyecto
cd C:\Users\Josthin.paz\Pictures\BACKEND
```

### 2. Crear un Entorno Virtual

Se recomienda usar un entorno virtual para aislar las dependencias:

```bash
# En Windows
python -m venv venv

# Activar el entorno virtual
venv\Scripts\activate
```

Deberías ver `(venv)` al principio de tu línea de comando.

### 3. Instalar Dependencias

Con el entorno virtual activado, instala todas las dependencias:

```bash
pip install -r requirements.txt
```

**Dependencias principales:**
- **FastAPI** (0.115.12) - Framework web moderno
- **SQLAlchemy** - ORM para base de datos
- **Alembic** (1.15.2) - Herramienta de migraciones
- **Pydantic** (2.11.4) - Validación de datos
- **MariaDB** (1.1.12) - Driver para MariaDB
- **passlib** - Hashing de contraseñas
- **python-jose** - JWT para autenticación
- **email-validator** - Validación de emails
- **fastapi-mail** (1.5.0) - Para envío de emails
- **bcrypt** (4.3.0) - Encriptación

---

## ⚙️ Configuración

### 1. Crear Base de Datos

Primero, crea la base de datos en MySQL/MariaDB:

```sql
CREATE DATABASE nombre_base_datos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```bash
# Base de Datos
DATABASE_URL=mysql+pymysql://usuario:contraseña@localhost:3306/nombre_base_datos

# Seguridad
SECRET_KEY=tu_clave_secreta_muy_larga_y_compleja_aqui
ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Email Configuration (SMTP - Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM=tu_email@gmail.com
MAIL_PASSWORD=tu_contraseña_app  # Para Gmail: usar contraseña de aplicación (no la contraseña normal)
MAIL_FROM_NAME=Sistema de Soporte Técnico

# OpenAI (si usas IA para sugerencias)
OPENAI_API_KEY=tu_api_key_aqui

# Debug
DEBUG=False
```

**Configuración de Gmail:**
1. Habilita la autenticación de dos factores en tu cuenta de Google
2. Genera una "contraseña de aplicación" en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Usa esa contraseña en la variable `MAIL_PASSWORD`

**Ejemplo de URL de base de datos:**
```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/soporte_tecnico
```

---

## � Guía de Autenticación

### Flujo de Registro
1. Usuario envía: nombre, email, contraseña, rol
2. Sistema valida que el email no exista
3. Se hashea la contraseña con bcrypt
4. Se crea el usuario en la BD
5. Se envía email de bienvenida
6. Se devuelve JWT token para acceso inmediato

### Flujo de Login
1. Usuario envía: email y contraseña
2. Sistema verifica credenciales
3. Si son correctas, genera y devuelve JWT token
4. Cliente guarda el token y lo usa en headers: `Authorization: Bearer {token}`

### Flujo de Recuperación de Contraseña
1. Usuario solicita recuperación con su email
2. Sistema genera código de 6 dígitos (válido 30 minutos)
3. Se envía código al correo
4. Usuario verifica el código (POST `/verificar-codigo`)
5. Usuario reestablece contraseña con el código
6. Sistema actualiza contraseña y limpia el código

### Códigos de Estado HTTP
- `200` - Solicitud exitosa
- `201` - Recurso creado exitosamente
- `400` - Solicitud inválida (validación fallida)
- `401` - No autorizado (credenciales incorrectas)
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

---

Este proyecto utiliza **Alembic** para manejar las migraciones de base de datos.

### Estructura de Migraciones

Las migraciones se encuentran en la carpeta `migraciones/versions/`.

### Ejecutar Migraciones (Crear Tablas)

Para aplicar todas las migraciones pendientes y crear las tablas en la base de datos:

alembic init migraciones

```bash
# Con el entorno virtual activado
alembic init migraciones
alembic revision --autogenerate -m "subo tablas"
alembic upgrade head
```

Este comando:
- Crea todas las tablas necesarias
- Establece las relaciones entre tablas
- Aplica todas las migraciones pendientes

### Ver Estado de Migraciones

Para verificar el estado actual de las migraciones:

```bash
alembic current
```

### Ver Historial de Migraciones

Para ver todas las migraciones aplicadas:

```bash
alembic history
```

### Crear una Nueva Migración (Si Modificas Models)

Si haces cambios en los modelos de SQLAlchemy en la carpeta `models/`, necesitarás crear una nueva migración:

```bash
# Autogenerar migración basada en cambios en models
alembic revision --autogenerate -m "Descripción del cambio"

# Revisar el archivo generado en migraciones/versions/

# Aplicar la migración
alembic upgrade head
```

---

## ▶️ Ejecutar el Proyecto

### Iniciar el Servidor de Desarrollo

Con el entorno virtual activado:

```bash
# Opción 1: Ejecutar con Uvicorn directamente
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Opción 2: Si tienes uvicorn instalado
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Parámetros:**
- `--reload` - Reinicia el servidor cuando detecta cambios
- `--host 0.0.0.0` - Accesible desde cualquier interfaz de red
- `--port 8000` - Puerto en el que corre el servidor

### Acceder a la API

Una vez que el servidor esté corriendo:

- **API Base URL**: http://localhost:8000
- **Documentación Interactiva (Swagger)**: http://localhost:8000/docs
- **Documentación Alternativa (ReDoc)**: http://localhost:8000/redoc

---

## 📁 Estructura del Proyecto

```
BACKEND/
├── main.py                 # Punto de entrada de la aplicación
├── requirements.txt        # Dependencias del proyecto
├── pyproject.toml         # Configuración de herramientas (black, isort, ruff)
├── alembic.ini            # Configuración de migraciones
├── .env                   # Variables de entorno (crear manualmente)
├── .env.text              # Ejemplo de variables (referencia)
│
├── api/                   # (Vacío, puede usarse para versiones de API)
│
├── controllers/           # Controladores (endpoints)
│   ├── rol_controller.py
│   ├── usuario_controller.py
│   ├── zona_controller.py
│   ├── estacion_controller.py
│   ├── categoria_controller.py
│   ├── prioridad_controller.py
│   ├── ticket_controller.py
│   ├── comentario_controller.py
│   └── notificacion_controller.py
│
├── models/                # Modelos SQLAlchemy (ORM)
│   ├── __init__.py
│   ├── roles.py
│   ├── usuarios.py
│   ├── zonas.py
│   ├── estaciones.py
│   ├── categorias.py
│   ├── prioridades.py
│   ├── tickets.py
│   ├── comentarios.py
│   └── notificaciones.py
│
├── dtos/                  # Data Transfer Objects (validación)
│   ├── rol_dto.py
│   ├── usuario_dto.py
│   ├── zona_dto.py
│   ├── estacion_dto.py
│   ├── categoria_dto.py
│   ├── prioridad_dto.py
│   ├── ticket_dto.py
│   ├── comentario_dto.py
│   └── notificacion_dto.py
│
├── db/                    # Configuración de base de datos
│   ├── __init__.py
│   ├── base.py            # Clase base para modelos
│   ├── database.py        # Conexión a BD
│   └── session.py         # Sesión de BD
│
└── migraciones/           # Scripts de migración Alembic
    ├── env.py
    ├── script.py.mako
    └── versions/          # Migraciones versionadas
```

---

## 🔌 Endpoints Disponibles

### Autenticación y Usuarios

#### Registro
- `POST /usuarios/registro` - Crear nueva cuenta de usuario
  ```json
  {
    "nombre_completo": "Juan Pérez",
    "correo_institucional": "juan@example.com",
    "contrasena": "MiContraseña123",
    "id_rol": 2
  }
  ```
  Respuesta:
  ```json
  {
    "id_usuario": 1,
    "nombre_completo": "Juan Pérez",
    "correo_institucional": "juan@example.com",
    "access_token": "eyJhbGc...",
    "token_type": "bearer"
  }
  ```

#### Login
- `POST /usuarios/login` - Iniciar sesión
  ```json
  {
    "correo_institucional": "juan@example.com",
    "contrasena": "MiContraseña123"
  }
  ```
  Respuesta: Token JWT con datos del usuario

#### Recuperación de Contraseña - Solicitud
- `POST /usuarios/solicitar-recuperacion` - Solicitar código de recuperación
  ```json
  {
    "correo_institucional": "juan@example.com"
  }
  ```
  **Acción**: Envía un código de 6 dígitos al correo electrónico

#### Recuperación de Contraseña - Verificar Código
- `POST /usuarios/verificar-codigo` - Verificar código de recuperación
  ```json
  {
    "correo_institucional": "juan@example.com",
    "codigo": "123456"
  }
  ```

#### Recuperación de Contraseña - Reestablecer
- `POST /usuarios/reestablecer-contrasena` - Cambiar contraseña con código
  ```json
  {
    "correo_institucional": "juan@example.com",
    "codigo": "123456",
    "nueva_contrasena": "NuevaContraseña456"
  }
  ```

#### Usuarios - CRUD
- `GET /usuarios` - Listar todos los usuarios
- `GET /usuarios/{id}` - Obtener usuario por ID
- `POST /usuarios` - Crear usuario (sin autenticación social)
- `PUT /usuarios/{id}` - Actualizar datos del usuario
- `DELETE /usuarios/{id}` - Eliminar usuario

### Zonas
- `GET /zonas` - Listar zonas
- `POST /zonas` - Crear zona
- `PUT /zonas/{id}` - Actualizar zona
- `DELETE /zonas/{id}` - Eliminar zona

### Estaciones
- `GET /estaciones` - Listar estaciones
- `POST /estaciones` - Crear estación
- `PUT /estaciones/{id}` - Actualizar estación
- `DELETE /estaciones/{id}` - Eliminar estación

### Categorías
- `GET /categorias` - Listar categorías
- `POST /categorias` - Crear categoría
- `PUT /categorias/{id}` - Actualizar categoría
- `DELETE /categorias/{id}` - Eliminar categoría

### Prioridades
- `GET /prioridades` - Listar prioridades
- `POST /prioridades` - Crear prioridad
- `PUT /prioridades/{id}` - Actualizar prioridad
- `DELETE /prioridades/{id}` - Eliminar prioridad

### Tickets
- `GET /tickets` - Listar tickets
- `GET /tickets/{id}` - Obtener ticket por ID
- `POST /tickets` - Crear ticket
- `PUT /tickets/{id}` - Actualizar ticket
- `DELETE /tickets/{id}` - Eliminar ticket

### Comentarios
- `GET /comentarios` - Listar comentarios
- `POST /comentarios` - Crear comentario
- `DELETE /comentarios/{id}` - Eliminar comentario

### Notificaciones
- `GET /notificaciones` - Listar notificaciones
- `POST /notificaciones` - Crear notificación
- `PUT /notificaciones/{id}` - Marcar como leída

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| Python | 3.12+ | Lenguaje de programación |
| FastAPI | 0.115.12 | Framework web |
| SQLAlchemy | Latest | ORM |
| Alembic | 1.15.2 | Migraciones de BD |
| Pydantic | 2.11.4 | Validación de datos |
| MariaDB | 1.1.12 | Base de datos |
| Passlib | 1.7.4 | Seguridad de contraseñas |
| Python-jose | Latest | JWT |
| FastAPI-Mail | 1.5.0 | Envío de emails |
| Bcrypt | 4.3.0 | Encriptación |
| OpenAI | 2.6.1 | IA (opcional) |

---

## 🚀 Comandos Rápidos

```bash
# Activar entorno virtual
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
alembic upgrade head

# Ejecutar servidor
python -m uvicorn main:app --reload

# Desactivar entorno virtual
deactivate
```

---

## 📝 Notas Importantes

1. **Variables de Entorno**: Nunca subas el archivo `.env` a un repositorio. Usa siempre `.gitignore`.
2. **Base de Datos**: Asegúrate de que MySQL/MariaDB esté corriendo antes de ejecutar la aplicación.
3. **Migraciones**: Siempre ejecuta `alembic upgrade head` después de descargar cambios del repositorio.
4. **Documentación API**: Accede a `/docs` para una interfaz interactiva de prueba.

---

## 📧 Soporte

Para más información, consulta la documentación de:
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

---

**Último actualizado**: 23 de febrero de 2026