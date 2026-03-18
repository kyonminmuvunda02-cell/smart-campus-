import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, func as sa_func

from app.modules.venues.models.venue import Venue
from app.modules.venues.schemas.venue import VenueCreate, VenueUpdate
from app.modules.core.exceptions import NotFoundException, ConflictException

logger = logging.getLogger(__name__)


class VenueService:

    @staticmethod
    def has_geofence(venue: Venue) -> bool:
        return all(
            value is not None
            for value in (venue.latitude, venue.longitude, venue.radius_meters)
        )

    @staticmethod
    def require_geofence(venue: Venue) -> None:
        if not VenueService.has_geofence(venue):
            raise ConflictException(
                "Venue geofence is incomplete. Configure latitude, longitude, and radius before using it for attendance."
            )

    @staticmethod
    def create_venue(db: Session, data: VenueCreate) -> Venue:
        """Create a new venue. Raises 409 if venue_name already exists."""
        existing = db.execute(
            select(Venue).where(Venue.venue_name == data.venue_name)
        ).scalars().first()
        if existing:
            raise ConflictException(f"Venue '{data.venue_name}' already exists")

        venue = Venue(**data.model_dump())
        db.add(venue)
        db.flush()
        logger.info("Venue created", extra={"venue_id": venue.venue_id})
        return venue

    @staticmethod
    def get_venue(db: Session, venue_id: int) -> Venue:
        """Fetch a venue by ID. Raises 404 if not found."""
        venue = db.execute(
            select(Venue).where(Venue.venue_id == venue_id)
        ).scalars().first()
        if not venue:
            raise NotFoundException("Venue not found")
        return venue

    @staticmethod
    def list_venues(db: Session, skip: int = 0, limit: int = 20) -> dict:
        """Return paginated list of venues."""
        total = db.execute(select(sa_func.count()).select_from(Venue)).scalar_one()
        items = db.execute(
            select(Venue).order_by(Venue.venue_name).offset(skip).limit(limit)
        ).scalars().all()
        return {"items": items, "total": total, "skip": skip, "limit": limit}

    @staticmethod
    def update_venue(db: Session, venue_id: int, data: VenueUpdate) -> Venue:
        """Update mutable venue fields."""
        venue = VenueService.get_venue(db, venue_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(venue, field, value)
        db.flush()
        return venue

    @staticmethod
    def delete_venue(db: Session, venue_id: int) -> None:
        """Soft-delete a venue. Raises 404 if not found."""
        venue = VenueService.get_venue(db, venue_id)
        venue.is_deleted = True
        venue.deleted_at = sa_func.now()
        db.flush()
        logger.info("Venue softly deleted", extra={"venue_id": venue_id})
