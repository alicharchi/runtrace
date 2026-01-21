import json

data = {
    "Runs_Registry": "http://localhost:8001",
    "Broker": "localhost:9092",    
    "extractors": [
        {
            "name": "continuityInfo",
            "pattern": r"^time step continuity errors\s+:\s+sum local\s+=\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?),\s+global\s+=\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?),\s+cumulative\s+=\s+([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)",
            "groups" : ["cont_err_local","cont_err_global","cont_err_cumulative"]
        }
        
    ],

}

file_path = "config.json"

with open(file_path, "w") as json_file:
    json.dump(data, json_file, indent=2)