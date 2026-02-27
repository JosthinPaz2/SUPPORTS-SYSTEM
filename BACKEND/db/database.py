from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# connection string
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:admin@localhost:3315/OTDREPORTES"

# crea el objeto de conexion(permite conectarse a la base de datos)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
