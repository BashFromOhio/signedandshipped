# StayReady reference (drill 17, Bug Hunt b7): tenant comes from the authenticated identity.
from fastapi import APIRouter, Depends, HTTPException

from .auth import current_user   # verifies the session token server-side
from .db import db

router = APIRouter()

@router.get("/api/v1/reservations/current")
def current_reservation(user=Depends(current_user)):
    # X-Tenant-Id and query parameters are ignored for authorization.
    row = db.reservations.find_one(tenant_id=user.tenant_id, guest_id=user.id)
    if row is None:
        raise HTTPException(status_code=404)
    return row
