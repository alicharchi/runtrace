from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.runinfo import RunInfo
from app.models.run import Runs
from app.schemas.run import RunInfoCreate

router = APIRouter(tags=["runinfo"])

@router.post("/runinfo/{run_id}", response_model=List[RunInfo])
def create_runinfo(
    run_id: int,
    info_list: List[RunInfoCreate],
    session: Session = Depends(get_session),
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
