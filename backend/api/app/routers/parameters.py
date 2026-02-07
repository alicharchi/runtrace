from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.utils.auth import get_current_user
from app.database import get_session
from app.models.event import Events
from app.models.run import Runs

router = APIRouter(tags=["parameters"])

@router.get("/parameters", response_model=List[str])
def get_parameters(
    runid: Optional[int] = Query(None, description="Filter parameters by run id"),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    stmt = (
        select(Events.parameter)
        .join(Runs, Events.run_id == Runs.id)
        .where(Runs.user_id == current_user.id)
    )

    if runid is not None:
        stmt = stmt.where(Runs.id == runid)

    stmt = stmt.distinct().order_by(Events.parameter)

    return session.exec(stmt).all()
