from datetime import datetime
from typing import Dict, List
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException

from ai_service import AIService
from models import (
    CheckInRequest,
    CheckInResponse,
    ETAResult,
    NoShowRiskRequest,
    NoShowRiskResponse,
    QueueEntry,
    QueueSnapshotResponse,
    QueueStatus,
    SMSComposeRequest,
    SMSComposeResponse,
)

router = APIRouter()
ai_service = AIService()
IN_MEMORY_QUEUE: Dict[UUID, List[QueueEntry]] = {}


@router.post("/checkins", response_model=CheckInResponse, tags=["queue"])
async def create_checkin(payload: CheckInRequest) -> CheckInResponse:
    eta_raw = await ai_service.predict_eta(payload.model_dump())

    try:
        eta = ETAResult(**eta_raw)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Invalid ETA inference output: {exc}")

    entry = QueueEntry(
        id=uuid4(),
        location_id=payload.location_id,
        status=QueueStatus.WAITING,
        party_size=payload.party_size,
        seating_preference=payload.seating_preference,
        phone_e164=payload.phone_e164,
        eta_low_min=eta.eta_low_min,
        eta_high_min=eta.eta_high_min,
        created_at=datetime.utcnow(),
    )

    IN_MEMORY_QUEUE.setdefault(payload.location_id, []).append(entry)

    return CheckInResponse(
        queue_entry_id=entry.id,
        status=entry.status,
        created_at=entry.created_at,
        eta=eta,
    )


@router.post("/ai/no-show-risk", response_model=NoShowRiskResponse, tags=["ai"])
async def no_show_risk(payload: NoShowRiskRequest) -> NoShowRiskResponse:
    risk_raw = await ai_service.score_no_show_risk(payload.model_dump())

    try:
        return NoShowRiskResponse(queue_entry_id=payload.queue_entry_id, **risk_raw)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Invalid risk inference output: {exc}")


@router.post("/ai/sms/eta-update", response_model=SMSComposeResponse, tags=["ai"])
async def compose_eta_sms(payload: SMSComposeRequest) -> SMSComposeResponse:
    sms_raw = await ai_service.compose_sms_eta_update(payload.model_dump())

    try:
        return SMSComposeResponse(**sms_raw)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Invalid SMS inference output: {exc}")


@router.get("/locations/{location_id}/queue", response_model=QueueSnapshotResponse, tags=["queue"])
def get_queue(location_id: UUID) -> QueueSnapshotResponse:
    entries = IN_MEMORY_QUEUE.get(location_id, [])
    waiting = [e for e in entries if e.status in {QueueStatus.WAITING, QueueStatus.HELD, QueueStatus.NOTIFIED}]
    return QueueSnapshotResponse(location_id=location_id, total_waiting=len(waiting), entries=entries)
