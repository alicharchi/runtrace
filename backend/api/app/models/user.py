from typing import Optional
from sqlmodel import SQLModel, Field

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)    
    email: str = Field(sa_column_kwargs={"unique": True, "nullable": False})
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    password: str = Field(nullable=False)    
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)