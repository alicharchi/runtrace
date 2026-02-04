import requests

class RunManager:
    def __init__(self,baseURL:str):
        self._baseURL = baseURL        
        
    def Register(self)->int:
        url = self._baseURL + "/runs/"        
        response = requests.post(url, json={})
        response.raise_for_status()
        self._runId = response.json()["id"]
        return self._runId
    
    @property
    def RunId(self)->int:
        return self._runId

    def Update(self,data:dict):
        url = f"{self._baseURL}/runinfo/{self.RunId}"
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def MarkAsEnded(self,exitFlag)->None:
        url = f"{self._baseURL}/runs/{self.RunId}/ended"
        print(f'Sending request {url}')
        response = requests.put(url, json={"exitflag":str(exitFlag)})
        response.raise_for_status()
        return response.json()