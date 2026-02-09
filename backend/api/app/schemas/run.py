from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class RunsCreate(BaseModel):
    time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

class RunsEnd(BaseModel):
    exitflag: int

class RunsRead(BaseModel):
    id: int
    time: datetime
    status: int
    exitflag: Optional[int]
    endtime: Optional[datetime]

    class Config:
        from_attributes = True

class RunInfoCreate(BaseModel):
    property: str
    value: str

class RunInfoRead(BaseModel):
    id: int
    property: str
    value: str

    class Config:
        from_attributes = True
