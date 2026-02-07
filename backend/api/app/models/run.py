from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship
from .enums import RunStatus

class Runs(SQLModel, table=True):
    __tablename__ = "runs"

    id: Optional[int] = Field(default=None, primary_key=True)

    time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    status: int = Field(default=RunStatus.RUNNING, nullable=False)
    exitflag: Optional[int] = Field(default=None)
    emailsent: bool = Field(default=False, nullable=False)
    endtime: Optional[datetime] = Field(default=None)

    # Foreign key
    user_id: int = Field(foreign_key="users.id", nullable=False)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="runs")
    events: List["Events"] = Relationship(back_populates="run")
    runinfo: List["RunInfo"] = Relationship(back_populates="run")
