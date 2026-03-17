from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.modules.core.database import get_db
from app.modules.auth.dependencies import require_role
from app.modules.venues.services.venue_service import VenueService
from app.modules.venues.schemas.venue import VenueCreate, VenueUpdate, VenueResponse, VenueList

router = APIRouter(prefix="/venues", tags=["venues"])


@router.post(
    "/",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    name="create_venue",
    operation_id="createVenue",
    dependencies=[Depends(require_role("Admin"))],
)
def create_venue(data: VenueCreate, db: Session = Depends(get_db)):
    """Admin: create a new lecture venue."""
    venue = VenueService.create_venue(db, data)
    db.commit()
    db.refresh(venue)
    return venue


@router.get(
    "/",
    response_model=VenueList,
    name="list_venues",
    operation_id="listVenues",
    dependencies=[Depends(require_role("Lecturer", "Admin"))],
)
def list_venues(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List all venues."""
    return VenueService.list_venues(db, skip, limit)


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    name="get_venue",
    operation_id="getVenue",
    dependencies=[Depends(require_role("Lecturer", "Admin"))],
)
def get_venue(venue_id: int, db: Session = Depends(get_db)):
    """Get a single venue by ID."""
    return VenueService.get_venue(db, venue_id)


@router.patch(
    "/{venue_id}",
    response_model=VenueResponse,
    name="update_venue",
    operation_id="updateVenue",
    dependencies=[Depends(require_role("Admin"))],
)
def update_venue(venue_id: int, data: VenueUpdate, db: Session = Depends(get_db)):
    """Admin: update venue details."""
    venue = VenueService.update_venue(db, venue_id, data)
    db.commit()
    db.refresh(venue)
    return venue


@router.delete(
    "/{venue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="delete_venue",
    operation_id="deleteVenue",
    dependencies=[Depends(require_role("Admin"))],
)
def delete_venue(venue_id: int, db: Session = Depends(get_db)):
    """Admin: delete a venue."""
    VenueService.delete_venue(db, venue_id)
    db.commit()
