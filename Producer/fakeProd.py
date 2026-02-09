from datetime import datetime
import argparse
import numpy as np
from Shared.RunsLib import RunManager

from Shared.transmitters import KafkaTransmitter

def submitRunHeader(manager:RunManager):
    info_list = []

    info_list.append({"property": "build", "value": "12345"})
    info_list.append({"property": "version", "value": "1712"})
    info_list.append({"property": "openfoam", "value": "v1712"})

    now = datetime.now()
    iso_string = now.isoformat()
    info_list.append({"property": "time", "value": iso_string})
    
    runinfo_response = manager.Update(info_list)

    print("Sent RunInfo:")
    for info in runinfo_response:
        print(f"  {info['property']}: [{info['value']}]")

Base_URL = "http://localhost:8001"
userName,Password = "user@test.com","test!123"
Kafka_Broker = "localhost:9092"

parser = argparse.ArgumentParser()
parser.add_argument("endTime", help=f"End time" , type=float)
parser.add_argument("stepSize", help=f"Step size" , type=float)
parser.add_argument("--broker", help=f"Kafka broker address and port (default: {Kafka_Broker})" , default=Kafka_Broker)
parser.add_argument("--runs_registry", help=f"Api for registering run (default: {Base_URL})", default=Base_URL)
args = parser.parse_args()

with RunManager(Base_URL, userName,Password) as rm:
    try:
        run_id = rm.Register()
        print(f'Run registerd as {run_id}')

        parameters = ['cont_err_cumulative','cont_err_global','cont_err_local','fake_error']
        baselines = {'cont_err_cumulative':1.0,'cont_err_global':0.8,'cont_err_local':0.6,'fake_error':2.0}
        freq = 1
        b = 0.1

        sim_time = 0.0
        i = 0
        submitRunHeader(rm)

        with KafkaTransmitter(Kafka_Broker) as tx:
            while (sim_time<=args.endTime):
                for p in parameters:    
                    a = baselines[p]
                    rng = np.random.default_rng()
                    message = {"run_id":run_id, "sim_time":sim_time, "parameter":p}            
                    value = a * np.sin(2 * np.pi * freq * sim_time) + rng.uniform(-b, b)                
                    kv = {"value":value}
                    tx.Transmit(message | kv , "events")
                    
                if (i % 10 == 0): print(f'Sent t={sim_time:0.2f}')

                sim_time+=args.stepSize
                i+=1
    except Exception as e:
        print(f"An error occurred: {e}")
        rm.MarkAsEnded(-1)

    rm.MarkAsEnded(0)