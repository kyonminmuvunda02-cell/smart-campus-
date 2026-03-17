"""Utility functions for the application."""

import hashlib
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.routing import APIRoute


def generate_openapi_json(app: FastAPI) -> None:
    """
    Generate openapi.json in the frontend folder when schema changes.
    
    Only regenerates if the schema hash has changed to avoid unnecessary writes.
    """
    output_path = Path(__file__).resolve().parent.parent.parent.parent.parent / "frontend" / "openapi.json"
    hash_path = output_path.with_suffix(".hash")
    
    openapi_schema = app.openapi()
    schema_json = json.dumps(openapi_schema, indent=2)
    current_hash = hashlib.md5(schema_json.encode("utf-8")).hexdigest()

    previous_hash = hash_path.read_text(encoding="utf-8").strip() if hash_path.exists() else None

    if current_hash != previous_hash:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(schema_json, encoding="utf-8")
        hash_path.write_text(current_hash, encoding="utf-8")
        print(f"[openapi] JSON updated at {output_path}")
    else:
        print("[openapi] No changes detected; openapi.json not regenerated")


def generate_operation_id(route: APIRoute) -> str:
    """
    Generate operation ID for OpenAPI documentation.
    
    Uses the first tag and route name to create a descriptive operation ID.
    """
    if route.tags:
        return f"{route.tags[0]}-{route.name}"
    return route.name


def generate_unique_number(db, model, prefix: str, field: str = "number") -> str:
    """Generate a unique number with format PREFIX-YYYYMMDD-NNNN."""
    from datetime import datetime
    from sqlalchemy import func, desc

    today = datetime.now().strftime("%Y%m%d")
    base_prefix = f"{prefix}-{today}-"
    
    # Find last number for today
    last_record = db.query(model).filter(
        getattr(model, field).like(f"{base_prefix}%")
    ).order_by(desc(getattr(model, field))).first()

    if last_record:
        last_number = getattr(last_record, field)
        sequence = int(last_number.split("-")[-1]) + 1
    else:
        sequence = 1

    return f"{base_prefix}{sequence:04d}"
