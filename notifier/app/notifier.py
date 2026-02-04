import logging
from logging_config import setup_logging
from typing import Optional
import time
from datetime import datetime, timezone
from typing import List

from sqlmodel import SQLModel, Field, create_engine, Session, select
from pydantic import BaseModel

class RunStatus:
    RUNNING = 1
    COMPLETED = 2
    FAILED = 3

if not logging.getLogger().handlers:
    setup_logging('notifier')

logger = logging.getLogger(__name__)

# -------------------------------
# Configuration
# -------------------------------
DB_USER = "postgres"
DB_HOST = "db"
DB_PORT = "5432"
DB_NAME = "openFoam"

POLL_INTERVAL = 60  # seconds

# -------------------------------
# Models (matching your FastAPI app)
# -------------------------------
class Runs(SQLModel, table=True):
    id: int = Field(primary_key=True)
    status: int
    exitflag: Optional[int] = None
    email_sent: bool = False
    endTime: Optional[datetime] = None

# -------------------------------
# Utilities
# -------------------------------
def get_db_password():
    with open("/run/secrets/db-password", "r") as f:
        return f.read().strip()

def send_email(run_id: int):
    # Placeholder: replace with actual email sending logic
    logger.debug(f"Sending email for run {run_id}")

# -------------------------------
# Database setup
# -------------------------------
db_password = get_db_password()
connection_string = f"postgresql+psycopg2://{DB_USER}:{db_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
logger.info(f"Connecting to db: postgresql+psycopg2://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
engine = create_engine(connection_string, echo=False)

def get_pending_runs(session: Session) -> List[Runs]:
    stmt = select(Runs).where(Runs.status == RunStatus.COMPLETED, Runs.email_sent == False)
    return session.exec(stmt).all()

def mark_email_sent(session: Session, run_id: int):
    run = session.get(Runs, run_id)
    logger.debug(f'Setting emailsent to true for run {run_id}')
    if run:
        run.email_sent = True
        session.add(run)
        session.commit()

# -------------------------------
# Worker loop
# -------------------------------
def main():
    logger.info("Run Notifier started")
    while True:
        try:
            with Session(engine) as session:
                pending_runs = get_pending_runs(session)     
                logger.info(f'Found {len(pending_runs)} pending runs.')           
                for run in pending_runs:
                    send_email(run.id)
                    mark_email_sent(session, run.id)

        except Exception as e:
            logger.error(f"{e}")

        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
