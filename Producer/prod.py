import re
import os
from datetime import datetime
import argparse
import json
from pathlib import Path
import requests
from Shared.transmitters import KafkaTransmitter

class DataExtractor:
    def __init__(self,name:str,pattern:str,groups):
        super().__init__()
        self.name = name
        self.pattern = re.compile(pattern)
        self.groups = groups
    
    def Get(self,s:str):
        m = re.match(self.pattern,s)
        if m:            
            return {s:float(float(m.group(i+1))) for i,s in enumerate(self.groups)}
        else:
            return None

def getNewRunId():
    # Get run id
    url = Base_URL + "/runs/"
    run_put_response = requests.post(url, json={}).json()
    return run_put_response["id"]   

import re
from datetime import datetime
import requests

def submitRunHeader(run_id, header):
    info_list = []

    # Extract OpenFOAM build info
    pattern = re.compile(r"(?P<build_id>_[a-f0-9]+-\d{8})\s+OPENFOAM=(?P<openfoam>\d+)\s+version=v(?P<version>\w+)")    
    match = pattern.search(header.get("Build", ""))
    if match:
        d = match.groupdict()
        info_list.append({"property": "build", "value": d["build_id"]})
        info_list.append({"property": "version", "value": d["version"]})
        info_list.append({"property": "openfoam", "value": d["openfoam"]})

    for key in ["Exec", "Host", "PID", "Case", "nProcs"]:
        if key in header:
            info_list.append({"property": key.lower(), "value": str(header[key])})

    if "Date" in header and "Time" in header:
        dt = datetime.strptime(header["Date"] + " " + header["Time"], r"%b %d %Y %H:%M:%S")
        info_list.append({"property": "time", "value": dt.isoformat()})
    
    url = f"{Base_URL}/runinfo/{run_id}"
    response = requests.post(url, json=info_list)
    response.raise_for_status()  # raise exception if HTTP error
    runinfo_response = response.json()

    print("Sent RunInfo:")
    for info in runinfo_response:
        print(f"  {info['property']}: [{info['value']}]")

configFilePath = Path(__file__).parent /'config.json'
with open(configFilePath, 'r') as f:
    configData = json.load(f)    

Base_URL = configData["Runs_Registry"]
Kafka_Broker = configData["Broker"]

parser = argparse.ArgumentParser()
parser.add_argument("file", help="Log file name to consume")
args = parser.parse_args()

if not args.file:
    raise ValueError("Log file name must be provided as command-line argument")

if not os.path.exists(args.file):
    raise FileNotFoundError("Log file was not found")

sim_time = 0.0

# Get run id
run_id = getNewRunId()
print(f'Run registerd as {run_id}')

ignored_prefixes = [r'//',r'/*',r'\*',r'|']

extractors = []

for ex in configData["extractors"]:
    extractors.append(DataExtractor(ex["name"],ex["pattern"],ex["groups"]))

header_done = False
header = {key:None for key in ["Build","Exec","Date","Time","PID","Case","nProcs","Host"]}
ignored_Lines = 0
try:
    iters = {}
    with open(args.file, "r") as file:               
        i = 0
        with KafkaTransmitter(Kafka_Broker) as tx:
            for line in file:            
                event = line.strip()

                if event=='' or any(event.startswith(p) for p in ignored_prefixes):
                    ignored_Lines+=1
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
                    
                for ext in extractors:
                    m = ext.Get(event)
                    if m is not None:
                        message = {"run_id":run_id, "sim_time":sim_time}
                        for key,value in m.items():                        
                            iters[key] = iters.get(key, 0) + 1
                            kv = {"parameter":key, "value":value, "iter":iters[key]}                        
                            tx.Transmit(message | kv , "events")
                    break

except FileNotFoundError:
    print(f"Error: The file '{args.file}' was not found.")
except Exception as e:
    print(f"An error occurred: {e}")

print(f"Ignored lines: {ignored_Lines}")
print(f"Times sent: {i}")