import logging
from datetime import timezone
from zoneinfo import ZoneInfo

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app_config import CONFIG
from run_completed_email import renderHtmlBody, normalizeExitFlag
from email_sender import EmailSender

class RunStatus:
    RUNNING = 1
    COMPLETED = 2
    FAILED = 3

if not logging.getLogger().handlers:
    from logging_config import setup_logging
    setup_logging("notifier", level=CONFIG.LOG_LEVEL_NUM)

logger = logging.getLogger(__name__)

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


def send_email(run: dict, recipient: str):
    run_id = run['id']
    exit_flag = run['exitflag']
    end_time = format_local_time(run['endtime'])

    logger.info(f"Sending completion email for run {run_id} to {recipient}")

    status = normalizeExitFlag(exit_flag)
    subject = f"Run {run_id} completed ({status})"
    body = f"Run {run_id} completed!"
    html_body = renderHtmlBody(run_id, status, end_time)

    sender.send(recipient, subject, body, html_body)

db_password = get_db_password()
connection_string = (
    f"postgresql+psycopg2://{CONFIG.DB_USER}:{db_password}"
    f"@{CONFIG.DB_HOST}:{CONFIG.DB_PORT}/{CONFIG.DB_NAME}"
)

engine = create_engine(connection_string, echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

sender = EmailSender(
    sender_email=CONFIG.SENDER_EMAIL,
    password=CONFIG.SMTP_PSWD,
    server=CONFIG.SMTP_SERVER,
    port=CONFIG.SMTP_PORT,
    use_tls=False,
    logger=logger
)

def claim_completed_runs(session) -> list[dict]:
    stmt = text("""
        UPDATE runs
        SET emailsent = TRUE
        FROM users
        WHERE runs.user_id = users.id
          AND (runs.status = :completed OR runs.status = :failed)
          AND runs.emailsent = FALSE
          AND runs.id IN (
              SELECT id FROM runs
              WHERE (status = :completed OR status = :failed)
                AND emailsent = FALSE
              FOR UPDATE SKIP LOCKED
          )
        RETURNING runs.id, runs.exitflag, runs.endtime, users.email
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

def notify_completed_runs():
    logger.debug("Polling for completed runs")

    try:
        with SessionLocal() as session:
            completed_runs = claim_completed_runs(session)

            if not completed_runs:
                logger.debug("No completed runs to notify")
                return

            logger.info(f"Claimed {len(completed_runs)} runs for notification")

            failed_runs = []

            for r in completed_runs:
                recipient = r["email"]
                try:
                    send_email(r, recipient)
                    logger.debug(
                        f"Email sent successfully for run {r['id']}",
                        extra={"run_id": r["id"], "exitflag": r["exitflag"], "recipient": recipient}
                    )
                except Exception:
                    logger.exception(
                        "Email send failed for run",
                        extra={"run_id": r["id"], "exitflag": r["exitflag"], "recipient": recipient}
                    )
                    failed_runs.append(r["id"])

            if failed_runs:
                logger.info(f"Resetting emailsent for {len(failed_runs)} failed runs")
                session.execute(
                    text("UPDATE runs SET emailsent = FALSE WHERE id = ANY(:ids)"),
                    {"ids": failed_runs}
                )
                session.commit()

    except Exception:
        logger.exception("Notifier job failed")

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
