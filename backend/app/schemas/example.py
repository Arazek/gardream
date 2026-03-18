from datetime import datetime
from pydantic import BaseModel


class ExampleItemBase(BaseModel):
    title: str
    description: str | None = None


class ExampleItemCreate(ExampleItemBase):
    pass


class ExampleItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class ExampleItemResponse(ExampleItemBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
