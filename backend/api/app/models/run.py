from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Index
from app.models.enums import RunStatus

class Runs(SQLModel, table=True):
    __tablename__ = "runs"

    id: Optional[int] = Field(default=None, primary_key=True)
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: int = Field(default=RunStatus.RUNNING, nullable=False)
    exitflag: Optional[int] = Field(default=None)
    emailsent: bool = Field(default=False, nullable=False)
    endtime: Optional[datetime] = Field(default=None)

    user_id: int = Field(foreign_key="users.id", nullable=False)
    
    user: Optional["User"] = Relationship(back_populates="runs")
    runinfo: List["RunInfo"] = Relationship(
        back_populates="run",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    events: List["Events"] = Relationship(
        back_populates="run",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    __table_args__ = (
        Index("idx_runs_user_id", "user_id"),
    )
