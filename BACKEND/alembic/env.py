from logging.config import fileConfig
import os
import sys
from dotenv import load_dotenv

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Cargar variables de entorno desde .env
load_dotenv()

# Agregar el path del proyecto para importar modelos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# this is the Alembic Config object
config = context.config

# Configurar la URL de la base de datos desde .env
config.set_main_option('sqlalchemy.url', os.getenv('SQLALCHEMY_DATABASE_URL'))

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importar tu Base.metadata (ajusta la ruta según tu estructura)
from db.base import Base
target_metadata = Base.metadata

# Importar todos tus modelos para que Alembic los detecte
# Esto es necesario para el autogenerate
import models  # Asegúrate de que este import cargue todos tus modelos
# O importa modelos específicos:
# from models import User, Ticket, Comment, etc.

# other values from the config, defined by the needs of env.py
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()