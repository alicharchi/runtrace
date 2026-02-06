from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.database import get_session
from app.models.run import Runs
from app.schemas.run import RunsCreate, RunsEnd
from app.models.enums import RunStatus

router = APIRouter(prefix="/runs", tags=["runs"])

@router.post("/", response_model=Runs)
def create_run(
    run: RunsCreate,
    session: Session = Depends(get_session),
):
    db_run = Runs(
        time=run.time,
        status=RunStatus.RUNNING,
    )
    session.add(db_run)
    session.commit()
    session.refresh(db_run)
    return db_run

@router.get("/", response_model=List[Runs])
def get_runs(session: Session = Depends(get_session)):
    stmt = select(Runs)
    return session.exec(stmt).all()

@router.put("/{run_id}/ended", response_model=Runs)
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
    db_run.endtime = datetime.now(timezone.utc)

    session.commit()
    session.refresh(db_run)

    return db_run
