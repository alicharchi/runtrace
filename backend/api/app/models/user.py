from typing import List, Optional
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str
    is_active: bool = True
    is_superuser: bool = False
    email_verified: bool = False
    
    runs: List["Runs"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
