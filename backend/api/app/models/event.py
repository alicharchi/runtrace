from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Index
from app.models.run import Runs

class Events(SQLModel, table=True):
    __tablename__ = "events"

    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int = Field(foreign_key="runs.id", nullable=False)
    sim_time: float = Field(nullable=False)
    parameter: str = Field(nullable=False)
    value: float = Field(nullable=False)
    
    run: Optional["Runs"] = Relationship(back_populates="events")

    __table_args__ = (
        Index("idx_events_run_param_time", "run_id", "parameter", "sim_time"),
    )
