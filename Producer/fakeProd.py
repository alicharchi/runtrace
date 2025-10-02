import io
from datetime import datetime
import argparse
import numpy as np

import requests
from kafka import KafkaProducer
import fastavro
       
def encode_avro_record(record: dict, schema: dict) -> bytes:
    bytes_writer = io.BytesIO()
    fastavro.schemaless_writer(bytes_writer, schema, record)
    return bytes_writer.getvalue()

def getNewRunId():
    # Get run id
    url = Base_URL + "/runs/"
    run_put_response = requests.post(url, json={}).json()
    return run_put_response["id"]   

def submitRunHeader(id):
    payload = {}
    payload["build"]="615aae61d7-20250627"
    payload["version"]="2506"
    payload["exec"] = "pisoFoam"
    payload["host"] = "fake"
    payload["pid"] = 0
    payload["case"] = "/fake/case"
    payload["nprocs"] = 1
    payload["time"] = datetime.now().isoformat()

    url = Base_URL + f"/runs/{id}"
    run_put_response = requests.put(url, json=payload).json()
    print('Sending header:')
    for k,v in run_put_response.items():
        print(f' {k}: [{v}]')

Base_URL = "http://localhost:8001"
Kafka_Broker = "localhost:9092"

parser = argparse.ArgumentParser()
parser.add_argument("endTime", help=f"End time" , type=float)
parser.add_argument("stepSize", help=f"Step size" , type=float)
parser.add_argument("--iters", help=f"Number of iterations in each time step" , type=int, default=2)
parser.add_argument("--broker", help=f"Kafka broker address and port (default: {Kafka_Broker})" , default=Kafka_Broker)
parser.add_argument("--runs_registry", help=f"Api for registering run (default: {Base_URL})", default=Base_URL)
args = parser.parse_args()

with open(r".\consumer\app\EventRecord.avsc", "r") as f:
    schema = fastavro.parse_schema(eval(f.read()))

# Kafka producer
producer = KafkaProducer(
    bootstrap_servers=Kafka_Broker
)

# Get run id
run_id = getNewRunId()
print(f'Run registerd as {run_id}')

parameters = ['cont_err_cumulative','cont_err_global','cont_err_local','fake_error']
baselines = {'cont_err_cumulative':1.0,'cont_err_global':0.8,'cont_err_local':0.6,'fake_error':2.0}
freq = 1
b = 0.1

sim_time = 0.0
i = 0
submitRunHeader(run_id)
while (sim_time<=args.endTime):
    for p in parameters:    
        a = baselines[p]
        rng = np.random.default_rng()
        message = {"run_id":run_id, "sim_time":sim_time, "parameter":p}
        for iter in range(1,args.iters+1):
            value = a * np.sin(2 * np.pi * freq * sim_time) + rng.uniform(-b, b)                
            kv = {"value":value, "iter":iter}
            encoded_message = encode_avro_record(message | kv, schema)
            producer.send("events", value=encoded_message)
        
    if (i % 10 == 0): print(f'Sent t={sim_time:0.2f}')

    sim_time+=args.stepSize
    i+=1

producer.flush()
