import os
import io
import logging
import json
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable

import fastavro

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Double, insert

def get_db_password():
    with open("/run/secrets/db-password", "r") as f:
        return f.read().strip()

def decode_avro_fast(encoded_bytes, schema):
    bytes_reader = io.BytesIO(encoded_bytes)
    return fastavro.schemaless_reader(bytes_reader, schema)


logger = logging.getLogger(__name__)
logging.basicConfig(filename='/app/data/consumerlogs.log', level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(name)s: %(message)s')  
try:
    user = 'postgres'
    password = get_db_password()
    host = 'db'
    port = '5432'
    database = 'openFoam'

    # Construct the connection string
    connection_string = f'postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}'    

    logger.info(f'Connecting to db: {connection_string}')
    engine = create_engine(connection_string)

    metadata = MetaData()
    events_table = Table(
        'events', metadata,
        Column('id', Integer, primary_key=True),
        Column('run_id', Integer),
        Column('sim_time', Double),        
        Column('parameter', String),
        Column('value', Double)
    )

    logger.info('Creating meta data')
    metadata.create_all(engine)

except Exception as e:
    logger.error(f"An unexpected error occurred: {e}")    

consumer = None
bootstrap = os.getenv("BOOTSTRAP_SERVERS", "kafka:9093")

try:
    logger.info(f"Attempting to parse avro schema")
    with open("EventRecord.avsc", "r") as f:
        schema = fastavro.parse_schema(json.load(f))
    
    logger.info(f"Attempting to connect to kafka broker at {bootstrap}")
    consumer = KafkaConsumer(
        'events',
        bootstrap_servers=[bootstrap],
        group_id='g1',
        consumer_timeout_ms=5000,
        auto_offset_reset='earliest'    
    )

    logger.info("Getting messages ...")

    BATCH_SIZE = 1000
    batch = []

    with engine.connect() as connection:
        while True:        
            for message in consumer:
                decoded = decode_avro_fast(message.value, schema)
                batch.append(decoded)
                if len(batch) >= BATCH_SIZE:
                    connection.execute(insert(events_table), batch)
                    logger.info(f"Inserted batch of {len(batch)} records. Last sim_time={batch[-1]['sim_time']}")
                    batch.clear()
                    connection.commit()

            # flush remaining records
            if batch:
                connection.execute(insert(events_table), batch)
                logger.info(f"Inserted final batch of {len(batch)} records.")
                batch.clear()
                connection.commit()

except NoBrokersAvailable:
    logger.error(f"Error: No Kafka brokers available at the specified address: [{bootstrap}]")    
except Exception as e:
    logger.error(f"An unexpected error occurred: {e}")    
finally:
    if consumer is not None:
        logger.info('Closing consumer')
        consumer.close() 
    else:
        logger.warning('Consumer is None. Nothing to close.')

logger.handlers.clear()