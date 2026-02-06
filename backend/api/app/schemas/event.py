from typing import Optional, List
from pydantic import BaseModel

class EventsCreate(BaseModel):
    run_id: int
    sim_time: float
    parameter: str
    value: float

class EventsRead(BaseModel):
    id: int
    run_id: int
    sim_time: float
    parameter: str
    value: float
    class Config:
        from_attributes = True

class EventsReduced(BaseModel):
    sim_time: float
    value: float

class EventsSeries(BaseModel):
    points: List[EventsReduced]
