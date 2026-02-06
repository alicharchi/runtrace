from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

from .run import Runs

class Events(SQLModel, table=True):
    __tablename__ = "events"

    id: Optional[int] = Field(default=None, primary_key=True)

    run_id: int = Field(
        foreign_key="runs.id",
        nullable=False,
        index=True,
    )

    sim_time: float = Field(nullable=False, index=True)
    parameter: str = Field(nullable=False, index=True)
    value: float = Field(nullable=False)


    run: Optional[Runs] = Relationship(back_populates="events")
