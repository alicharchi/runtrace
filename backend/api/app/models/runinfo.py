from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

from .run import Runs


class RunInfo(SQLModel, table=True):
    __tablename__ = "runinfo"

    id: Optional[int] = Field(default=None, primary_key=True)

    run_id: int = Field(
        foreign_key="runs.id",
        nullable=False,
    )

    property: str = Field(nullable=False)
    value: str = Field(nullable=False)

    run: Optional[Runs] = Relationship(back_populates="runinfo")
