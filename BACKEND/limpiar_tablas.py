import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'supports_system.db')

print(f"Limpiando base de datos: {db_path}")
print("=" * 60)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = [
    'users',
    'notifications',
    'changes_history',
    'comments',
    'tickets',
    'map_decorations',
    'stations',
    'floors',
    'locations',
    'categories',
    'alembic_version'
]

for table in tables:
    try:
        cursor.execute(f"DELETE FROM {table};")
        print(f"Tabla {table} limpiada")
    except Exception as e:
        print(f"Error en {table}: {e}")

# Guardar cambios
conn.commit()
conn.close()

print("=" * 60)
print("limpiadas")