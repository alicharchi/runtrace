import os

import logging
from logging_config import setup_logging
from typing import Optional, List
from datetime import datetime
from app_config import CONFIG

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from sqlmodel import SQLModel, Field, create_engine, Session
from sqlalchemy import text

from email_sender import EmailSender

# -------------------------------
# Constants / Enums
# -------------------------------
class RunStatus:
    RUNNING = 1
    COMPLETED = 2
    FAILED = 3

# -------------------------------
# Logging
# -------------------------------
if not logging.getLogger().handlers:
    setup_logging("notifier", level=CONFIG.LOG_LEVEL)

logger = logging.getLogger(__name__)

# -------------------------------
# Models (READ-ONLY)
# -------------------------------
class Runs(SQLModel):
    __tablename__ = "runs"
    id: int
    status: int
    email_sent: bool

# -------------------------------
# Utilities
# -------------------------------
def get_db_password() -> str:
    with open(CONFIG.PSWD_FILE, "r") as f:
        return f.read().strip()

def send_email(run_id: int):
    """
    Replace this with real email logic.
    MUST be idempotent or tolerate retries.
    """
    logger.info(f"Sending completion email for run {run_id}")
    
    subject = "Run Completed"
    body = f"Run {run_id} completed!"
    recipient = "ali2@test.com"
    sender.send(recipient, subject, body)

# -------------------------------
# Database setup
# -------------------------------
db_password = get_db_password()
connection_string = (
    f"postgresql+psycopg2://{CONFIG.DB_USER}:{db_password}@{CONFIG.DB_HOST}:{CONFIG.DB_PORT}/{CONFIG.DB_NAME}"
)

engine = create_engine(connection_string, echo=False)

sender = EmailSender(
    sender_email=CONFIG.SENDER_EMAIL,
    server=CONFIG.SMTP_SERVER,
    port=CONFIG.SMTP_PORT,
    use_tls=False,
    logger=logger
)

# -------------------------------
# Exactly-once logic
# -------------------------------
def claim_completed_runs(session: Session) -> list[int]:
    stmt = text("""
        UPDATE runs
        SET email_sent = TRUE
        WHERE id IN (
            SELECT id
            FROM runs
            WHERE status = :completed
              AND email_sent = FALSE
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id
    """)

    result = session.execute(
        stmt,
        {"completed": RunStatus.COMPLETED}
    )

    try:
        run_ids = [row[0] for row in result.fetchall()]
        session.commit()
        return run_ids
    except Exception:
        session.rollback()
        raise

# -------------------------------
# Scheduled job
# -------------------------------
def notify_completed_runs():
    logger.debug("Polling for completed runs...")

    try:
        with Session(engine) as session:
            run_ids = claim_completed_runs(session)

            if not run_ids:
                logger.debug("No completed runs to notify")
                return

            logger.info(f"Claimed {len(run_ids)} runs for notification")

            for run_id in run_ids:
                try:
                    send_email(run_id)
                except Exception:
                    # Email failed AFTER being claimed
                    # This is intentional: exactly-once > at-least-once
                    logger.exception(
                        f"Email send failed for run {run_id}. "
                        f"Manual intervention may be required."
                    )

    except Exception:
        logger.exception("Notifier job failed")

# -------------------------------
# Scheduler bootstrap
# -------------------------------
def main():
    logger.info("Run Notifier starting")

    scheduler = BlockingScheduler(timezone="UTC")

    scheduler.add_job(
        notify_completed_runs,
        trigger=IntervalTrigger(seconds=CONFIG.POLL_INTERVAL),
        id="run_completion_notifier",
        max_instances=1,
        replace_existing=True,
    )

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Run Notifier stopped")

if __name__ == "__main__":
    main()
