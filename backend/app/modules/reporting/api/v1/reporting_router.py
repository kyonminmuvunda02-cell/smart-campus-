from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.auth.dependencies import get_current_user, require_role
from app.modules.core.database import get_db
from app.modules.reporting.schemas.dashboard import DashboardSummaryResponse
from app.modules.reporting.services.dashboard_service import DashboardReportingService


router = APIRouter(prefix="/reporting", tags=["reporting"])


@router.get(
    "/dashboard-summary",
    response_model=DashboardSummaryResponse,
    operation_id="getDashboardSummary",
    name="get_dashboard_summary",
    dependencies=[Depends(require_role("Student", "Lecturer", "Admin"))],
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return DashboardReportingService.get_dashboard_summary(
        db,
        user_id=current_user["user_id"],
        role=current_user["role"],
    )
