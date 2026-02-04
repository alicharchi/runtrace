from typing import Optional, List, Union
from datetime import datetime, timezone

from pydantic import BaseModel
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select, Relationship

# -------------------------------
# Secrets
# -------------------------------
def get_db_password():
    with open("/run/secrets/db-password", "r") as f:
        return f.read().strip()

class RunStatus:
    RUNNING = 1
    COMPLETED = 2
    FAILED = 3

# -------------------------------
# Models
# -------------------------------
class Runs(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    time: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Optional[int] = Field(default=RunStatus.RUNNING)
    exitflag: Optional[int] = Field(default=None)
    email_sent: Optional[bool] = Field(default=False)
    events: List["Events"] = Relationship(back_populates="run")
    runinfo: List["RunInfo"] = Relationship(back_populates="run")
    endTime: Optional[datetime] = Field(default=None)

class RunsCreate(BaseModel):
    time: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class RunsEnd(BaseModel):        
    exitflag: int

class Events(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[int] = Field(default=None, foreign_key="runs.id")
    run: Optional[Runs] = Relationship(back_populates="events")
    sim_time: float
    parameter: str
    value: float
    iter: int

class EventsCreate(SQLModel):    
    run_id: Optional[int] = None
    sim_time: Optional[float] = None
    parameter: Optional[str] = None
    value: Optional[float] = None
    iter: Optional[int] = None

class EventsReduced(BaseModel):
    sim_time: float
    value: float

class EventsSeries(BaseModel):
    iter: Optional[int] = None
    points: List[EventsReduced]

class RunInfo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[int] = Field(default=None, foreign_key="runs.id")
    run: Optional[Runs] = Relationship(back_populates="runinfo")
    property: str
    value: str

class RunInfoCreate(SQLModel):    
    property: Optional[str] = None
    value: Optional[str] = None

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# -------------------------------
# Endpoints
# -------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/runs/", response_model=Runs)
def create_run(run: RunsCreate, session: Session = Depends(get_session)):
    db_run = Runs(**run.dict() | {'status':RunStatus.RUNNING})
    session.add(db_run)
    session.commit()
    session.refresh(db_run)
    return db_run

@app.get("/runs", response_model=List[Runs])
def get_runs(session: Session = Depends(get_session)):
    statement = select(Runs)
    return session.exec(statement).all()

@app.put("/runs/{run_id}/ended", response_model=Runs)
def run_ended(
    run_id: int,
    payload: RunsEnd,
    session: Session = Depends(get_session),
):
    db_run = session.get(Runs, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")

    db_run.status = (
        RunStatus.FAILED if payload.exitflag != 0 else RunStatus.COMPLETED
    )
    
    db_run.exitflag = payload.exitflag
    db_run.endTime = datetime.now(timezone.utc)

    session.add(db_run)
    session.commit()
    session.refresh(db_run)

    return db_run

@app.post("/runinfo/{run_id}", response_model=List[RunInfo])
def create_runinfo(
    run_id: int,
    info_list: List[RunInfoCreate],
    session: Session = Depends(get_session)
):
    run = session.get(Runs, run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run with id={run_id} not found")

    db_info_list = []
    for info in info_list:
        db_info = RunInfo(run_id=run_id, property=info.property, value=info.value)
        session.add(db_info)
        db_info_list.append(db_info)

    session.commit()
    for db_info in db_info_list:
        session.refresh(db_info)

    return db_info_list

@app.post("/events/", response_model=Union[Events, List[Events]])
def create_events(
    events: Union[EventsCreate, List[EventsCreate]],
    session: Session = Depends(get_session)
):
    # Normalize to list
    if isinstance(events, EventsCreate):
        events_list = [events]
        single = True
    else:
        events_list = events
        single = False

    db_events = []
    for event in events_list:
        db_event = Events(**event.dict())
        session.add(db_event)
        db_events.append(db_event)

    session.commit()
    for db_event in db_events:
        session.refresh(db_event)

    return db_events[0] if single else db_events

@app.get("/events", response_model=List[Events])
def get_events(session: Session = Depends(get_session)):
    statement = select(Events)    
    stmt = select(Events).order_by(Events.sim_time)
    return session.exec(stmt).all()

@app.get("/events/filter", response_model=Union[List[EventsReduced], List[EventsSeries]])
def get_events_by_parameter(
    parameter: Optional[str] = Query(None),
    runid: Optional[int] = Query(None),
    iter: Optional[int] = Query(None),
    time_min: float = Query(0),
    time_max: float = Query(-1),
    session: Session = Depends(get_session),
):
    if parameter is None or runid is None:
        return []

    MAX_POINTS = 5000

    if iter is not None:        
        stmt = (
            select(Events.sim_time, Events.value)
            .where(
                Events.parameter == parameter,
                Events.run_id == runid,
                Events.iter == iter,
                Events.sim_time >= time_min,
            )
            .order_by(Events.sim_time.desc())
            .limit(MAX_POINTS)
        )

        if time_max != -1:
            stmt = stmt.where(Events.sim_time <= time_max)

        rows = session.exec(stmt).all()
        rows.reverse()
        return [EventsReduced(sim_time=t, value=v) for t, v in rows]

    else:        
        stmt = select(Events.sim_time, Events.value, Events.iter).where(
            Events.parameter == parameter,
            Events.run_id == runid,
            Events.sim_time >= time_min,
        )

        if time_max != -1:
            stmt = stmt.where(Events.sim_time <= time_max)

        # fetch a lot, will limit per iter after
        rows = session.exec(stmt.order_by(Events.sim_time.desc())).all()

        # group by iter
        series_dict = {}
        for t, v, it in rows:
            series_dict.setdefault(it, []).append((t, v))

        result = []
        for it, pts in series_dict.items():
            pts = list(reversed(pts[:MAX_POINTS]))
            result.append(EventsSeries(
                iter=it,
                points=[EventsReduced(sim_time=t, value=v) for t, v in pts]
            ))

        return result

@app.get("/parameters", response_model=List[str])
def get_parameters(session: Session = Depends(get_session)):
    statement = (
        select(Events.parameter)
        .distinct()
        .order_by(Events.parameter)
    )
    return session.exec(statement).all()

@app.get("/iters", response_model=List[int])
def get_iters(
    runid: Optional[int] = Query(None),
    parameter: Optional[str] = Query(None),
    session: Session = Depends(get_session),
):
    stmt = select(Events.iter).distinct()

    if runid is not None:
        stmt = stmt.where(Events.run_id == runid)
    if parameter is not None:
        stmt = stmt.where(Events.parameter == parameter)

    stmt = stmt.order_by(Events.iter)
    return session.exec(stmt).all()


