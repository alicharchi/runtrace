from pydantic import BaseModel

class RunInfoCreate(BaseModel):
    property: str
    value: str

class RunInfoRead(BaseModel):
    id: int
    property: str
    value: str

    class Config:
        from_attributes = True
