from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.event import Events

router = APIRouter(tags=["parameters"])

@router.get("/parameters", response_model=List[str])
def get_parameters(
    session: Session = Depends(get_session),
):
    """
    Return distinct event parameter names.
    """
    stmt = (
        select(Events.parameter)
        .distinct()
        .order_by(Events.parameter)
    )
    return session.exec(stmt).all()
