import fastavro
import io
from kafka import KafkaProducer
import re
import requests
from datetime import datetime, timezone

class DataExtractor:
    def __init__(self,pattern:str,groups):
        super().__init__()
        self.pattern = re.compile(pattern)
        self.groups = groups
    
    def Get(self,s:str):
        m = re.match(self.pattern,s)
        if m:
            return {self.groups[i]:float(m.group(i)) for i in self.groups}
        else:
            return None
       
def encode_avro_record(record: dict, schema: dict) -> bytes:
    bytes_writer = io.BytesIO()
    fastavro.schemaless_writer(bytes_writer, schema, record)
    return bytes_writer.getvalue()

def getNewRunId():
    # Get run id
    url = Base_URL + "/runs/"
    run_put_response = requests.post(url, json={}).json()
    return run_put_response["id"]   

def submitRunHeader(id,header):
    payload = {}    
    pattern = re.compile(r"(?P<build_id>_[a-f0-9]+-\d{8})\s+OPENFOAM=(?P<openfoam>\d+)\s+version=v(?P<version>\w+)")
    match = pattern.search(header["Build"])
    if match:
        d = match.groupdict()
        payload["build"]=d["build_id"]
        payload["version"]=d['version']
        
    payload["exec"] = header["Exec"]
    payload["host"] = header["Host"]
    payload["pid"] = header["PID"]
    payload["case"] = header["Case"]
    payload["nprocs"] = header["nProcs"]       
    payload["time"] = datetime.strptime(header["Date"]+" " + header["Time"], r"%b %d %Y %H:%M:%S").isoformat()

    url = Base_URL + f"/runs/{id}"
    run_put_response = requests.put(url, json=payload).json()
    print(run_put_response)

Base_URL = "http://localhost:8001"

with open(r".\consumer\app\EventRecord.avsc", "r") as f:
    schema = fastavro.parse_schema(eval(f.read()))

# Kafka producer
producer = KafkaProducer(
    bootstrap_servers="localhost:9092"
)

sim_time = 0.0

# Get run id
run_id = getNewRunId()
print(f'Run id is {run_id}')

ignored_prefixes = [r'//',r'/*',r'\*',r'|']

number_pattern = r"[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?"

extractors = {}

extractors["cont"] = DataExtractor(
    rf"^time step continuity errors\s+:\s+sum local\s+=\s+({number_pattern}),\s+global\s+=\s+({number_pattern}),\s+cumulative\s+=\s+({number_pattern})",
    {1:"cont_err_local",2:"cont_err_global",3:"cont_err_cumulative"}
    )

header_done = False
header = {key:None for key in ["Build","Exec","Date","Time","PID","Case","nProcs","Host"]}
try:
    iters = {}
    with open(r"C:\Users\alich\Documents\Py\reactorCFD\cases\case_0\log.pisoFoam", "r") as file:               
        i = 0
        for line in file:            
            event = line.strip()

            if event=='' or any(event.startswith(p) for p in ignored_prefixes):
                continue
            
            if (header_done==False and (event.lower()=="create time" or all(value is not None for value in header.values()))):
                header_done=True
                submitRunHeader(run_id,header)
                continue

            if (header_done==False):
                if (":" in event):
                    key, value = (s.strip() for s in event.split(":", 1))
                    if (key in header):
                        header[key]=value
                continue
                
            m = re.match(r"^Time\s+=\s+([-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?)",event)
            if m:
                sim_time = float(m.group(1))
                iters = {k: 0 for k in iters}
                i+=1
                if (i % 1000 == 0): print(f'Sent t={sim_time}')
                continue            
                
            for extName,ext in extractors.items():
                m = ext.Get(event)
                if m is not None:
                    message = {"run_id":run_id, "sim_time":sim_time}
                    for key,value in m.items():                        
                        iters[key] = iters.get(key, 0) + 1
                        kv = {"parameter":key, "value":value, "iter":iters[key]}                        
                        encoded_message = encode_avro_record(message | kv, schema)
                        producer.send("events", value=encoded_message)
                break
            
        producer.flush()


except FileNotFoundError:
    print("Error: The file 'your_file.txt' was not found.")
#except Exception as e:
#    print(f"An error occurred: {e}")
