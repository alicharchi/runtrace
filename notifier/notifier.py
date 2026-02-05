import os

import logging
from logging_config import setup_logging
from typing import Optional, List
from datetime import datetime
from app_config import CONFIG
from run_completed_email import renderHtmlBody,normalizeExitFlag
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from sqlmodel import SQLModel, Field, create_engine, Session
from sqlalchemy import text
from datetime import timezone
from zoneinfo import ZoneInfo
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
    setup_logging("notifier", level=CONFIG.LOG_LEVEL_NUM)

logger = logging.getLogger(__name__)

# -------------------------------
# Utilities
# -------------------------------
def get_db_password() -> str:
    with open(CONFIG.PSWD_FILE, "r") as f:
        return f.read().strip()

def format_local_time(dt) -> str:
    if dt is None:
        return "N/A"
    
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    local_dt = dt.astimezone(ZoneInfo(CONFIG.LOCAL_TIMEZONE))    
    local_dt = local_dt.replace(microsecond=0)

    return local_dt.strftime("%Y-%m-%d %H:%M:%S")

def send_email(run):
    run_id = run['id']
    exit_flag = run['exitflag']
    end_time = format_local_time(run['endtime'])
    logger.info(f"Sending completion email for run {run_id}")
    status = normalizeExitFlag(exit_flag)
    subject = f"Run {run_id} completed ({status})"
    body = f"Run {run_id} completed!"

    html_body = renderHtmlBody(run_id,status,end_time)
    recipient = "test@test.com"
    sender.send(recipient, subject, body,html_body)

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
    password=CONFIG.SMTP_PSWD,
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
        UPDATE runs r
        SET emailsent = TRUE
        FROM (
            SELECT id, exitflag, endtime
            FROM runs
            WHERE (status = :completed or status = :failed)
            AND emailsent = FALSE
            FOR UPDATE SKIP LOCKED
        ) sub
        WHERE r.id = sub.id
        RETURNING r.id, sub.exitflag, sub.endtime
    """)

    result = session.execute(
        stmt,
        {"completed": RunStatus.COMPLETED, "failed": RunStatus.FAILED}
    )

    try:        
        completed_runs = result.mappings().all()
        session.commit()
        return completed_runs
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
            completed_runs = claim_completed_runs(session)

            if not completed_runs:
                logger.debug("No completed runs to notify")
                return

            logger.info(f"Claimed {len(completed_runs)} runs for notification")

            for r in completed_runs:
                try:
                    send_email(r)
                except Exception:
                    # Email failed AFTER being claimed
                    # This is intentional: exactly-once > at-least-once
                    logger.exception(
                        "Email send failed after claiming run",
                        extra={"run_id": r["id"], "exitflag": r["exitflag"]}
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
