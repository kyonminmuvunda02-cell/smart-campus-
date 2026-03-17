from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class VenueBase(BaseModel):
    venue_name: str = Field(..., json_schema_extra={"example": "LT-1"})
    capacity: int | None = Field(None, gt=0, json_schema_extra={"example": 120})
    building: str | None = Field(None, json_schema_extra={"example": "Main Block"})


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    venue_name: str | None = None
    capacity: int | None = Field(None, gt=0)
    building: str | None = None


class VenueResponse(VenueBase):
    model_config = ConfigDict(from_attributes=True)
    venue_id: int
    created_at: datetime


class VenueList(BaseModel):
    items: list[VenueResponse]
    total: int
    skip: int
    limit: int
