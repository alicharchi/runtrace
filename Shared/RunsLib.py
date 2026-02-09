import requests

class RunManager:
    def __init__(self, baseURL: str, userName: str, password: str):
        self._baseURL = baseURL
        self._session = requests.Session()
        self._Authenticate(userName, password)

    def _Authenticate(self, userName: str, password: str):
        url = f"{self._baseURL}/auth/login"
        response = requests.post(
            url,
            data={"username": userName, "password": password},
            timeout=10,
        )
        response.raise_for_status()

        token = response.json()["access_token"]
        self._session.headers.update({
            "Authorization": f"Bearer {token}"
        })

    def Register(self) -> int:
        url = f"{self._baseURL}/runs/"
        response = self._session.post(url, json={}, timeout=10)
        response.raise_for_status()

        self._runId = response.json()["id"]
        return self._runId

    @property
    def RunId(self) -> int:
        if not hasattr(self, "_runId"):
            raise RuntimeError("Run is not registered yet")
        return self._runId

    def Update(self, data: dict):
        url = f"{self._baseURL}/runinfo/{self.RunId}"
        response = self._session.post(url, json=data, timeout=10)
        response.raise_for_status()
        return response.json()

    def MarkAsEnded(self, exitFlag) -> dict:
        url = f"{self._baseURL}/runs/{self.RunId}/ended"
        response = self._session.put(
            url,
            json={"exitflag": str(exitFlag)},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self._session.close()
