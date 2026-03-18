from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import datetime


class VenueBase(BaseModel):
    venue_name: str = Field(..., json_schema_extra={"example": "LT-1"})
    capacity: int | None = Field(None, gt=0, json_schema_extra={"example": 120})
    building: str | None = Field(None, json_schema_extra={"example": "Main Block"})
    latitude: float | None = Field(None, ge=-90, le=90, json_schema_extra={"example": -15.385})
    longitude: float | None = Field(None, ge=-180, le=180, json_schema_extra={"example": 28.322})
    radius_meters: float | None = Field(None, gt=0, json_schema_extra={"example": 45})

    @model_validator(mode="after")
    def validate_geofence_fields(self):
        geo_fields = [self.latitude, self.longitude, self.radius_meters]
        if any(value is not None for value in geo_fields) and not all(value is not None for value in geo_fields):
            raise ValueError("latitude, longitude, and radius_meters must be provided together")
        return self


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    venue_name: str | None = None
    capacity: int | None = Field(None, gt=0)
    building: str | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    radius_meters: float | None = Field(None, gt=0)

    @model_validator(mode="after")
    def validate_geofence_fields(self):
        geo_fields = [self.latitude, self.longitude, self.radius_meters]
        if any(value is not None for value in geo_fields) and not all(value is not None for value in geo_fields):
            raise ValueError("latitude, longitude, and radius_meters must be provided together")
        return self


class VenueResponse(VenueBase):
    model_config = ConfigDict(from_attributes=True)
    venue_id: int
    created_at: datetime


class VenueList(BaseModel):
    items: list[VenueResponse]
    total: int
    skip: int
    limit: int
