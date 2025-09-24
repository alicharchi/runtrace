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
    session: Session = Depends(get_session)
):
    statement = select(Events)
    if not (parameter and runid):
        return []
    
    statement = select(
        Events.sim_time,
        func.min(Events.value).label("value")
    ).where(
        (Events.parameter == parameter) & (Events.run_id == runid)
    ).group_by(
        Events.sim_time
    )
    
    results = session.exec(statement).all()
    return [EventsReduced(sim_time=row.sim_time, value=row.value) for row in results]
