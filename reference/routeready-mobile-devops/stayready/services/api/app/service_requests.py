# StayReady reference (drill 18, Bug Hunt b8): tenant-scoped, atomic idempotency.
# Schema: UNIQUE (tenant_id, idempotency_key); payload_hash stored with the row.
import hashlib, json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from .auth import current_user
from .db import Session, ServiceRequest
from .models import NewRequest

router = APIRouter()

def payload_hash(req: NewRequest) -> str:
    return hashlib.sha256(json.dumps(req.model_dump(exclude={"idempotency_key"}), sort_keys=True).encode()).hexdigest()

@router.post("/api/v1/service-requests", status_code=201)
def create(req: NewRequest, user=Depends(current_user)):
    h = payload_hash(req)
    with Session() as s:
        try:
            sr = ServiceRequest(tenant_id=user.tenant_id, guest_id=user.id,
                                idempotency_key=req.idempotency_key, payload_hash=h,
                                description=req.description, property_id=req.property_id)
            s.add(sr)
            s.commit()          # the unique index decides; no check-then-insert race
            return sr.to_dict()
        except IntegrityError:
            s.rollback()
            old = s.query(ServiceRequest).filter_by(tenant_id=user.tenant_id,
                                                    idempotency_key=req.idempotency_key).one()
            if old.payload_hash != h:
                raise HTTPException(409, "idempotency key reused with a different payload")
            return old.to_dict()  # replay: same result as the first, committed call
