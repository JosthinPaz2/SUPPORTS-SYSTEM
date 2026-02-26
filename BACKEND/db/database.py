from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# connection string: prefer DATABASE_URL, fall back to SQLALCHEMY_DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")
SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")
if DATABASE_URL:
    connection_string = DATABASE_URL
elif SQLALCHEMY_DATABASE_URL:
    connection_string = SQLALCHEMY_DATABASE_URL
else:
    raise RuntimeError("No database URL configured; set DATABASE_URL or SQLALCHEMY_DATABASE_URL")

# crea el objeto de conexion(permite conectarse a la base de datos)
engine = create_engine(connection_string)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
