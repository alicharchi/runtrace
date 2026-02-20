from typing import Optional
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
    user_id: int
    time: datetime
    status: int
    exitflag: Optional[int]
    endtime: Optional[datetime]
    user_email: Optional[str]
    user_first_name: Optional[str]
    user_last_name: Optional[str]

    class Config:
        from_attributes = True

class RunsUpdate(BaseModel):
    status: Optional[int] = None
    exitflag: Optional[int] = None
    endtime: Optional[datetime] = None
