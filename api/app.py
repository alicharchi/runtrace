from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, Depends, Query
from sqlmodel import SQLModel, Field, create_engine, Session, select

from sqlalchemy import func

def get_db_password():
    with open("/run/secrets/db-password", "r") as f:
        return f.read().strip()
    
# -------------------------------
# Define the SQLModel for Events
# -------------------------------
class Events(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int
    sim_time: float
    parameter: str
    value: float
    iter: int

class EventsReduced(BaseModel):
    sim_time: float
    value: float

# -------------------------------
# Database Setup
# -------------------------------
user = 'postgres'
password = get_db_password()
host = 'db'
port = '5432'
database = 'openFoam'

# Construct the connection string
connection_string = f'postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}'
engine = create_engine(connection_string, echo=True)


def get_session():
    with Session(engine) as session:
        yield session


# -------------------------------
# FastAPI app
# -------------------------------
app = FastAPI()


@app.on_event("startup")
def on_startup():
    # Makes sure the table exists (safe if already created)
    #SQLModel.metadata.create_all(engine)
    pass


# Get all events
@app.get("/events", response_model=List[Events])
def get_events(session: Session = Depends(get_session)):
    statement = select(Events)
    results = session.exec(statement).all()
    return results


# Get events filtered by parameter
@app.get("/events/filter", response_model=List[EventsReduced])
def get_events_by_parameter(
    parameter: Optional[str] = Query(None, description="Filter by parameter"),
    runid: Optional[int] = Query(None, description="Filter by runid"),
    iter: Optional[int] = Query(None, description="Filter by iteration"),
    time_min: Optional[float] = Query(0, description="Filter by min_time"),
    time_max: Optional[float] = Query(-1, description="Filter by max_time"),
    session: Session = Depends(get_session)
):
    statement = select(Events)
    if not (parameter and runid and iter):
        return []
    
    if (time_max==-1):    
        statement = select(
            Events.sim_time,
            Events.value
        ).where(
            (Events.parameter == parameter) 
            & (Events.run_id == runid) 
            & (Events.iter == iter)
            & (Events.sim_time>=time_min)
        )
    else:
        statement = select(
            Events.sim_time,
            Events.value
        ).where(
            (Events.parameter == parameter) 
            & (Events.run_id == runid) 
            & (Events.iter == iter)
            & (Events.sim_time>=time_min)
            & (Events.sim_time<=time_max)
        )

    
    results = session.exec(statement).all()
    return [EventsReduced(sim_time=row.sim_time, value=row.value) for row in results]
