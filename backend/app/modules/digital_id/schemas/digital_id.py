from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class DigitalIDBase(BaseModel):
    student_id: int
    id_number: str = Field(..., json_schema_extra={"example": "CUZ-DID-2024-001"})
    expires_at: datetime


class DigitalIDCreate(DigitalIDBase):
    pass


class DigitalIDResponse(DigitalIDBase):
    model_config = ConfigDict(from_attributes=True)

    digital_id_id: int
    is_active: bool
    issued_at: datetime
    revoked_at: datetime | None
    revoked_by: int | None
    created_at: datetime


class DigitalIDList(BaseModel):
    items: list[DigitalIDResponse]
    total: int
    skip: int
    limit: int


class DigitalIDRevokeRequest(BaseModel):
    reason: str | None = Field(None, json_schema_extra={"example": "Lost card reported"})
