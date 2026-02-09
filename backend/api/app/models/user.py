from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

from .run import Runs

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(sa_column_kwargs={"unique": True, "nullable": False})
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    password: str = Field(nullable=False)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    email_verified: bool = Field(default=False)
    runs: List[Runs] = Relationship(back_populates="user")
