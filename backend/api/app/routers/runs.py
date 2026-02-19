from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload

from app.utils.auth import get_current_user
from app.database import get_session
from app.models.run import Runs
from app.schemas.run import RunsCreate, RunsEnd, RunsRead
from app.models.enums import RunStatus

router = APIRouter(prefix="/runs", tags=["runs"])

@router.post("/", response_model=Runs)
def create_run(
    run: RunsCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    db_run = Runs(
        time=run.time or datetime.now(timezone.utc),
        status=RunStatus.RUNNING,
        user_id=current_user.id
    )
    session.add(db_run)
    session.commit()
    session.refresh(db_run)
    return db_run

@router.get("/", response_model=List[RunsRead])
def get_runs(
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user),
):
    stmt = select(Runs).options(selectinload(Runs.user))

    if not current_user.is_superuser:
        stmt = stmt.where(Runs.user_id == current_user.id)

    runs = session.exec(stmt).all()
    
    return [
        RunsRead(
            id=run.id,
            user_id=run.user_id,
            user_email=run.user.email if run.user else None,
            user_first_name=run.user.first_name if run.user else None,
            user_last_name=run.user.last_name if run.user else None,
            time=run.time,
            status=run.status,
            exitflag=run.exitflag,
            endtime=run.endtime,
        )
        for run in runs
    ]

@router.put("/{run_id}/ended", response_model=Runs)
def run_ended(
    run_id: int,
    payload: RunsEnd,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    db_run = session.get(Runs, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")

    if db_run.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403)

    db_run.status = (
        RunStatus.FAILED if payload.exitflag != 0 else RunStatus.COMPLETED
    )
    db_run.exitflag = payload.exitflag
    db_run.endtime = datetime.now(timezone.utc)

    session.commit()
    session.refresh(db_run)

    return db_run
