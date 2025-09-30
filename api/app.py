from typing import Optional, List
from datetime import datetime, timezone

from pydantic import BaseModel
from fastapi import FastAPI, Depends, Query
from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship


# -------------------------------
# Secrets
# -------------------------------
def get_db_password():
    with open("/run/secrets/db-password", "r") as f:
        return f.read().strip()


# -------------------------------
# Models
# -------------------------------
class Runs(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    build: Optional[str] = Field(default=None)   # <<< changed (lowercase for Postgres)
    version: Optional[str] = Field(default=None) # <<< changed
    exec: Optional[str] = Field(default=None)    # <<< changed
    time: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))  # <<< changed (callable)
    host: Optional[str] = Field(default=None)    # <<< changed
    pid: Optional[int] = Field(default=None)     # <<< changed
    case: Optional[str] = Field(default=None)    # <<< changed
    nprocs: Optional[int] = Field(default=None)  # <<< changed

    events: List["Events"] = Relationship(back_populates="run")  # <<< changed (was "team")


class Events(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[int] = Field(default=None, foreign_key="runs.id")  # <<< changed (added type + lowercase table)
    run: Optional[Runs] = Relationship(back_populates="events")         # <<< changed

    sim_time: float
    parameter: str
    value: float
    iter: int


class EventsReduced(BaseModel):
    sim_time: float
    value: float

class RunsCreate(BaseModel):
    build: Optional[str] = None
    version: Optional[str] = None
    exec: Optional[str] = None
    host: Optional[str] = None
    pid: Optional[int] = None
    case: Optional[str] = None
    nprocs: Optional[int] = None

# -------------------------------
# Database Setup
# -------------------------------
user = 'postgres'
password = get_db_password()
host = 'db'
port = '5432'
database = 'openFoam'

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
    SQLModel.metadata.create_all(engine)


# -------------------------------
# Endpoints
# -------------------------------

@app.post("/runs/", response_model=Runs)
def create_run(run: RunsCreate, session: Session = Depends(get_session)):
    db_run = Runs(**run.dict())
    session.add(db_run)
    session.commit()
    session.refresh(db_run)
    return db_run

@app.get("/runs", response_model=List[Runs])
def get_events(session: Session = Depends(get_session)):
    statement = select(Runs)
    results = session.exec(statement).all()
    return results

@app.get("/events", response_model=List[Events])
def get_events(session: Session = Depends(get_session)):
    statement = select(Events)
    results = session.exec(statement).all()
    return results

@app.get("/events/filter", response_model=List[EventsReduced])
def get_events_by_parameter(
    parameter: Optional[str] = Query(None, description="Filter by parameter"),
    runid: Optional[int] = Query(None, description="Filter by runid"),
    iter: Optional[int] = Query(None, description="Filter by iteration"),
    time_min: Optional[float] = Query(0, description="Filter by min_time"),
    time_max: Optional[float] = Query(-1, description="Filter by max_time"),
    session: Session = Depends(get_session)
):
    if not (parameter and runid and iter):
        return []

    if time_max == -1:
        statement = select(
            Events.sim_time,
            Events.value
        ).where(
            (Events.parameter == parameter)
            & (Events.run_id == runid)
            & (Events.iter == iter)
            & (Events.sim_time >= time_min)
        )
    else:
        statement = select(
            Events.sim_time,
            Events.value
        ).where(
            (Events.parameter == parameter)
            & (Events.run_id == runid)
            & (Events.iter == iter)
            & (Events.sim_time >= time_min)
            & (Events.sim_time <= time_max)
        )

    results = session.exec(statement).all()
    return [EventsReduced(sim_time=row[0], value=row[1]) for row in results]
