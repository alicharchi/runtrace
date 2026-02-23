from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, delete

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
        .distinct()
        .join(Runs, Events.run_id == Runs.id)
        .order_by(Events.parameter)
    )

    if not current_user.is_superuser:
        stmt = stmt.where(Runs.user_id == current_user.id)

    if runid is not None:
        stmt = stmt.where(Runs.id == runid)

    return session.exec(stmt).all()

@router.delete("/parameters", status_code=status.HTTP_204_NO_CONTENT)
def delete_parameter(
    run_id: int = Query(..., description="Run ID to delete the parameter from"),
    parameter: str = Query(..., description="Name of the parameter to delete"),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user),
):    
    run = session.get(Runs, run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
  
    if run.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to modify this run")

    stmt = delete(Events).where(Events.run_id == run_id, Events.parameter == parameter)
    result = session.exec(stmt)
    session.commit()

    return {"deleted_count": result.rowcount}