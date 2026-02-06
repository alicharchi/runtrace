from sqlmodel import SQLModel, create_engine, Session
from app.app_config import CONFIG

def get_db_password() -> str:
    with open(CONFIG.PSWD_FILE, "r") as f:
        return f.read().strip()

password = get_db_password()

DATABASE_URL = (
    f"postgresql+psycopg2://{CONFIG.DB_USER}:"
    f"{password}@{CONFIG.DB_HOST}:"
    f"{CONFIG.DB_PORT}/{CONFIG.DB_NAME}"
)

engine = create_engine(DATABASE_URL, echo=CONFIG.SQL_ECHO)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
