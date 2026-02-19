from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload

from app.utils.auth import get_current_user, get_current_user_from_jwt
from app.database import get_session
from app.models.run import Runs
from app.models.user import User
from app.schemas.run import RunsCreate, RunsEnd, RunsRead
from app.models.enums import RunStatus
from app.sse.run_broadcaster import run_broadcaster

router = APIRouter(prefix="/runs", tags=["runs"])

# ----------------- Create a run -----------------
@router.post("/", response_model=Runs)
def create_run(
    run: RunsCreate,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    db_run = Runs(
        time=run.time or datetime.now(timezone.utc),
        status=RunStatus.RUNNING,
        user_id=current_user.id,
    )
    session.add(db_run)
    session.commit()
    session.refresh(db_run)

    # Publish SSE event
    run_broadcaster.publish(
        run_id=db_run.id,
        owner_id=db_run.user_id,
        payload={
            "type": "run_started",
            "run_id": db_run.id,
            "status": db_run.status,
            "time": db_run.time.isoformat(),
        },
    )
    return db_run

# ----------------- List runs -----------------
@router.get("/", response_model=List[RunsRead])
def get_runs(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
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

# ----------------- SSE streaming endpoint -----------------
""" @router.get("/stream")
async def stream_runs(token: str = Query(...)):
    try:
        current_user = get_current_user_from_jwt(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",  
        "Access-Control-Allow-Credentials": "true"
    }

    print(f"User {current_user.id} connected to SSE")

    return StreamingResponse(
        run_broadcaster.subscribe(current_user),
        media_type="text/event-stream",
        headers=headers,
    ) """

@router.get("/stream")
async def stream_runs():
    print("SSE endpoint hit")
    headers = {"Cache-Control": "no-cache", "Connection": "keep-alive"}
    return StreamingResponse(run_broadcaster.subscribe(User(id=2, is_superuser=False, is_active=True)), media_type="text/event-stream", headers=headers)

# ----------------- Mark run ended -----------------
@router.put("/{run_id}/ended", response_model=Runs)
def run_ended(
    run_id: int,
    payload: RunsEnd,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    db_run = session.get(Runs, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")

    if db_run.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403)

    db_run.status = RunStatus.FAILED if payload.exitflag != 0 else RunStatus.COMPLETED
    db_run.exitflag = payload.exitflag
    db_run.endtime = datetime.now(timezone.utc)

    session.commit()
    session.refresh(db_run)

    # Publish SSE event
    run_broadcaster.publish(
        run_id=db_run.id,
        owner_id=db_run.user_id,
        payload={
            "type": "run_completed",
            "run_id": db_run.id,
            "status": db_run.status,
            "exitflag": db_run.exitflag,
            "endtime": db_run.endtime.isoformat(),
        },
    )
    return db_run
