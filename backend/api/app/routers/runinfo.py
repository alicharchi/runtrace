from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select

from app.utils.auth import get_current_user
from app.database import get_session
from app.models.runinfo import RunInfo
from app.models.run import Runs
from app.schemas.runinfo import RunInfoCreate, RunInfoRead

router = APIRouter(tags=["runinfo"])

@router.post("/runinfo/{run_id}", response_model=List[RunInfo])
def create_runinfo(
    run_id: int,
    info_list: List[RunInfoCreate],
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    run = session.get(Runs, run_id)
    if not run:
        raise HTTPException(
            status_code=404,
            detail=f"Run with id={run_id} not found",
        )

    db_info_list: List[RunInfo] = []

    for info in info_list:
        db_info = RunInfo(
            run_id=run_id,
            property=info.property,
            value=info.value,
        )
        session.add(db_info)
        db_info_list.append(db_info)

    session.commit()

    for db_info in db_info_list:
        session.refresh(db_info)

    return db_info_list

@router.get("/runinfo", response_model=List[RunInfoRead])
def get_parameters(
    runid: int = Query(..., description="Run id"),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user),
):    
    if not current_user.is_superuser:
        run = session.get(Runs, runid)
        if not run or run.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail=f"You do not have access to run {runid}",
            )

    stmt = select(RunInfo).where(RunInfo.run_id == runid)
    return session.exec(stmt).all()
