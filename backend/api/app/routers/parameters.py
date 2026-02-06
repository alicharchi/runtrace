from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.utils.auth import get_current_user
from app.database import get_session
from app.models.event import Events

router = APIRouter(tags=["parameters"])

@router.get("/parameters", response_model=List[str])
def get_parameters(
    runid: Optional[int] = Query(None, description="Filter parameters by run id"),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    stmt = select(Events.parameter)

    if runid is not None:
        stmt = stmt.where(Events.run_id == runid)

    stmt = stmt.distinct().order_by(Events.parameter)

    return session.exec(stmt).all()
