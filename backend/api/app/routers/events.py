from typing import Optional, List, Union

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select

from app.utils.auth import get_current_user
from app.database import get_session
from app.models.event import Events
from app.models.run import Runs 
from app.schemas.event import (
    EventsCreate,
    EventsReduced,
    EventsSeries,
)

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=Union[Events, List[Events]])
def create_events(
    events: Union[EventsCreate, List[EventsCreate]],
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):    
    if isinstance(events, EventsCreate):
        events_list = [events]
        single = True
    else:
        events_list = events
        single = False

    db_events: List[Events] = []

    for event in events_list:        
        run = session.get(Runs, event.run_id)
        if not run or run.user_id != current_user.id:
            raise HTTPException(status_code=403, detail=f"You do not have access to run {event.run_id}")

        db_event = Events(**event.dict())
        session.add(db_event)
        db_events.append(db_event)

    session.commit()
    for db_event in db_events:
        session.refresh(db_event)

    return db_events[0] if single else db_events


@router.get("/", response_model=List[Events])
def get_events(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    stmt = (
        select(Events)
        .join(Runs)
        .order_by(Events.sim_time)
    )

    if not current_user.is_superuser:
        stmt = stmt.where(Runs.user_id == current_user.id)

    return session.exec(stmt).all()

@router.get("/filter", response_model=EventsSeries)
def get_events_by_parameter(
    parameter: Optional[str] = Query(None),
    runid: Optional[int] = Query(None),
    time_min: float = Query(0),
    time_max: float = Query(-1),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
) -> EventsSeries:

    if parameter is None or runid is None:
        return EventsSeries(points=[])

    MAX_POINTS = 5000
    
    stmt = (
        select(Events.sim_time, Events.value)
        .join(Runs, Events.run_id == Runs.id)
        .where(
            Events.run_id == runid,
            Events.parameter == parameter,
            Events.sim_time >= time_min,
        )
    )

    if not current_user.is_superuser:
        stmt = stmt.where(Runs.user_id == current_user.id)

    if time_max != -1:
        stmt = stmt.where(Events.sim_time <= time_max)

    rows = session.exec(stmt.order_by(Events.sim_time)).all()

    if len(rows) > MAX_POINTS:
        step = len(rows) // MAX_POINTS
        rows = rows[::step]

    points = [
        EventsReduced(sim_time=sim_time, value=value)
        for sim_time, value in rows
    ]

    return EventsSeries(points=points)
