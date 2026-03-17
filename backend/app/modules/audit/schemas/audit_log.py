from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    log_id: int
    user_id: int | None
    action: str
    table_name: str | None
    record_id: int | None
    detail: str | None
    created_at: datetime


class AuditLogList(BaseModel):
    items: list[AuditLogResponse]
    total: int
    skip: int
    limit: int
