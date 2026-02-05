from app_config import CONFIG
import logging
from logging_config import setup_logging
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable



import msgpack

from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Double,
    insert,
)

def get_db_password():
    with open(CONFIG.PSWD_FILE, "r") as f:
        return f.read().strip()

def decode_msg(msg):
    event = msgpack.unpackb(msg, raw=False)
    if event["_v"] != 1:
        raise ValueError("Unsupported version")
    return event

# -------------------------------
# Configuration
# -------------------------------
if not logging.getLogger().handlers:    
    setup_logging("consumer", level=CONFIG.LOG_LEVEL_NUM)

logger = logging.getLogger(__name__)
engine = None

try:
    password = get_db_password()

    connection_string = (
        f"postgresql+psycopg2://{CONFIG.DB_USER}:{password}@{CONFIG.DB_HOST}:{CONFIG.DB_PORT}/{CONFIG.DB_NAME}"
    )

    logger.info(
        f"Connecting to db: postgresql+psycopg2://{CONFIG.DB_USER}@{CONFIG.DB_HOST}:{CONFIG.DB_PORT}/{CONFIG.DB_NAME}"
    )

    engine = create_engine(connection_string)

    metadata = MetaData()
    events_table = Table(
        "events",
        metadata,
        Column("id", Integer, primary_key=True),
        Column("run_id", Integer),
        Column("sim_time", Double),
        Column("parameter", String),
        Column("value", Double),
        Column("iter", Integer),
    )

    logger.info("Creating metadata")
    metadata.create_all(engine)

except Exception:
    logger.exception("Database initialization failed")
    raise

consumer = None

try:
    logger.info(f"Attempting to connect to kafka broker at {CONFIG.MSG_BROKER}")

    consumer = KafkaConsumer(
        "events",
        bootstrap_servers=[CONFIG.MSG_BROKER],
        group_id="g1",
        auto_offset_reset="earliest"
    )

    logger.info("Getting messages")

    BATCH_SIZE = 100
    batch = []

    with engine.connect() as connection:
        while True:
            for message in consumer:
                if message.value is None:
                    continue

                try:
                    decoded = decode_msg(message.value)
                except Exception:
                    logger.exception("Bad message")
                    continue

                batch.append(decoded)

                if len(batch) >= BATCH_SIZE:
                    connection.execute(insert(events_table), batch)
                    logger.info(
                        f"Inserted batch of {len(batch)} records. "
                        f"Last sim_time={batch[-1]['sim_time']}"
                    )
                    batch.clear()
                    connection.commit()

            if batch:
                connection.execute(insert(events_table), batch)
                logger.info(f"Inserted final batch of {len(batch)} records")
                batch.clear()
                connection.commit()

except NoBrokersAvailable:
    logger.error(
        f"No Kafka brokers available at the specified address: [{CONFIG.MSG_BROKER}]"
    )
except Exception:
    logger.exception("Unexpected runtime error")
finally:
    if consumer is not None:
        logger.info("Closing consumer")
        consumer.close()
    else:
        logger.warning("Consumer is None. Nothing to close.")
