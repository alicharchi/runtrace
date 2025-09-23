import os
import io
import logging
from datetime import datetime

from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable

import avro.schema
import avro.io

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Double, DateTime, insert
from sqlalchemy.sql import func

def get_db_password():
    with open("/run/secrets/db-password", "r") as f:
        return f.read().strip()

def decode_avro(encoded_bytes, schema):
    bytes_reader = io.BytesIO(encoded_bytes)
    decoder = avro.io.BinaryDecoder(bytes_reader)
    reader = avro.io.DatumReader(schema)
    return reader.read(decoder)


logger = logging.getLogger(__name__)
logging.basicConfig(filename='/app/data/consumerlogs.log', level=logging.INFO)
try:
    user = 'postgres'
    password = get_db_password()
    host = 'db'
    port = '5432'
    database = 'openFoam'

    # Construct the connection string
    connection_string = f'postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}'
    #connection_string = 'sqlite:////app/data/database.db'

    logger.info(f'Connecting to db: {connection_string}')
    engine = create_engine(connection_string)

    metadata = MetaData()
    events_table = Table(
        'events', metadata,
        Column('id', Integer, primary_key=True),
        Column('run_id', Integer),
        Column('sim_time', Double),
        Column('created_at', DateTime, default=func.now()),
        Column('paramerter', String),
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
    schema = avro.schema.parse(open("EventRecord.avsc", "r").read())
    
    logger.info(f"Attempting to connect to kafka broker at {bootstrap}")
    consumer = KafkaConsumer(
        'events',
        bootstrap_servers=[bootstrap],
        group_id='g1',
        consumer_timeout_ms=5000,
        auto_offset_reset='earliest'    
    )

    logger.info("Getting messages ...")
    
    with engine.connect() as connection:
        while True:        
            for message in consumer:
                decoded = decode_avro(message.value, schema)                
                decoded["created_at"] = datetime.fromisoformat(decoded["created_at"])
                insert_stmt = insert(events_table).values(decoded)
                connection.execute(insert_stmt)
                connection.commit()
                logger.info(f'{decoded["sim_time"]}')

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

logger.close()