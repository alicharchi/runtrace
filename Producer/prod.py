import fastavro
import io
from kafka import KafkaProducer
import re

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


with open(r".\consumer\app\EventRecord.avsc", "r") as f:
    schema = fastavro.parse_schema(eval(f.read()))

def encode_avro_record(record: dict, schema: dict) -> bytes:
    bytes_writer = io.BytesIO()
    fastavro.schemaless_writer(bytes_writer, schema, record)
    return bytes_writer.getvalue()

# Kafka producer
producer = KafkaProducer(
    bootstrap_servers="localhost:9092"
)

# Example message
sim_time = 0.0
run_id = 1

ignored_prefixes = [r'//',r'/*',r'\*',r'|']

number_pattern = r"[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?"

extractors = {}

extractors["cont"] = DataExtractor(
    rf"^time step continuity errors\s+:\s+sum local\s+=\s+({number_pattern}),\s+global\s+=\s+({number_pattern}),\s+cumulative\s+=\s+({number_pattern})",
    {1:"cont_err_local",2:"cont_err_global",3:"cont_err_cumulative"}
    )

try:
    iters = {}
    with open(r"C:\Users\alich\Documents\Py\reactorCFD\cases\case_0\log.pisoFoam", "r") as file:               
        for line in file:            
            event = line.strip()

            if event=='' or any(event.startswith(p) for p in ignored_prefixes):
                continue

            m = re.match(r"^Time\s+=\s+([-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?)",event)
            if m:
                sim_time = float(m.group(1))
                iters = {k: 0 for k in iters}
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
