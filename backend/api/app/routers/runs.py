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
from app.schemas.run import RunsCreate, RunsEnd, RunsRead, RunsUpdate
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

    # Publish SSE event with run owner info
    run_broadcaster.publish(
        run_id=db_run.id,
        owner_id=db_run.user_id,
        payload={
            "type": "run_started",
            "id": db_run.id,
            "status": db_run.status,
            "exitflag": None,
            "time": db_run.time.isoformat(),
            "endtime": None,
            "user_id": current_user.id,
            "user_first_name": current_user.first_name,
            "user_last_name": current_user.last_name,
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

# ----------------- Update run -----------------
@router.patch("/{run_id}", response_model=Runs)
def update_run(
    run_id: int,
    payload: RunsUpdate,
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    db_run = session.get(Runs, run_id)
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")

    if db_run.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    updated_fields = []

    if payload.status is not None:
        try:
            new_status = RunStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status value: {payload.status}")
        db_run.status = new_status
        updated_fields.append("status")

    if payload.exitflag is not None:
        db_run.exitflag = payload.exitflag
        updated_fields.append("exitflag")

    if payload.endtime is not None:
        db_run.endtime = payload.endtime
        updated_fields.append("endtime")

    if not updated_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    session.commit()
    session.refresh(db_run)

    # Get the actual run owner
    run_owner = session.get(User, db_run.user_id)

    # Publish SSE event
    run_broadcaster.publish(
        run_id=db_run.id,
        owner_id=db_run.user_id,
        payload={
            "type": "run_updated",
            "id": db_run.id,
            "updated_fields": updated_fields,
            "status": db_run.status,
            "exitflag": db_run.exitflag,
            "endtime": db_run.endtime.isoformat() if db_run.endtime else None,
            "user_id": run_owner.id,
            "user_first_name": run_owner.first_name,
            "user_last_name": run_owner.last_name,
        },
    )

    return db_run

# ----------------- SSE streaming endpoint -----------------
@router.get("/stream")
async def stream_runs(token: str = Query(...)):
    try:
        current_user = get_current_user_from_jwt(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
    }

    print(f"[*] User {current_user.id} connected to SSE")

    return StreamingResponse(
        run_broadcaster.subscribe(current_user),
        media_type="text/event-stream",
        headers=headers,
    )

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

    # Get actual run owner
    run_owner = session.get(User, db_run.user_id)

    # Publish SSE event
    run_broadcaster.publish(
        run_id=db_run.id,
        owner_id=db_run.user_id,
        payload={
            "type": "run_completed",
            "id": db_run.id,
            "status": db_run.status,
            "exitflag": db_run.exitflag,
            "time": db_run.time.isoformat() if db_run.time else None,
            "endtime": db_run.endtime.isoformat() if db_run.endtime else None,
            "user_id": run_owner.id,
            "user_first_name": run_owner.first_name,
            "user_last_name": run_owner.last_name,
        },
    )

    return db_run