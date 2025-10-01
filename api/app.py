from typing import Optional, List
from datetime import datetime, timezone

from pydantic import BaseModel
from fastapi import FastAPI, Depends, Query
from fastapi import HTTPException
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
    build: Optional[str] = Field(default=None)
    version: Optional[str] = Field(default=None)
    exec: Optional[str] = Field(default=None)
    time: Optional[datetime] = Field(default_factory=lambda: datetime.now())
    host: Optional[str] = Field(default=None)
    pid: Optional[int] = Field(default=None) 
    case: Optional[str] = Field(default=None)
    nprocs: Optional[int] = Field(default=None)

    events: List["Events"] = Relationship(back_populates="run")  


class Events(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[int] = Field(default=None, foreign_key="runs.id")  
    run: Optional[Runs] = Relationship(back_populates="events")        

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
    time: Optional[datetime] = Field(default_factory=lambda: datetime.now())

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

@app.put("/runs/{run_id}", response_model=Runs)
def update_run(run_id: int, run_update: RunsCreate, session: Session = Depends(get_session)):
    db_run = session.get(Runs, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail=f"Run with id={run_id} not found")
    
    update_data = run_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_run, key, value)

    session.add(db_run)
    session.commit()
    session.refresh(db_run)
    return db_run

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
