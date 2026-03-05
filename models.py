from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlmodel import SQLModel


class QueueStatus(str, Enum):
    WAITING = "WAITING"
    NOTIFIED = "NOTIFIED"
    SEATED = "SEATED"
    NO_SHOW = "NO_SHOW"
    CANCELLED = "CANCELLED"
    HELD = "HELD"


class RiskBucket(str, Enum):
    LOW = "LOW"
    MED = "MED"
    HIGH = "HIGH"


class CheckInRequest(BaseModel):
    location_id: UUID
    party_size: int = Field(ge=1, le=20)
    seating_preference: Optional[str] = None
    phone_e164: str
    current_queue_length: int = Field(ge=0)
    avg_turn_minutes: int = Field(ge=5, le=240)
    parties_seated_last_hour: int = Field(ge=0)


class ETAResult(BaseModel):
    eta_low_min: int
    eta_high_min: int
    confidence: float


class CheckInResponse(BaseModel):
    queue_entry_id: UUID
    status: QueueStatus
    created_at: datetime
    eta: ETAResult


class NoShowRiskRequest(BaseModel):
    location_id: UUID
    queue_entry_id: UUID
    wait_time_minutes: int = Field(ge=0)
    eta_drift_minutes: int = Field(ge=0)
    party_size: int = Field(ge=1, le=20)
    prior_no_show_count: int = Field(ge=0)
    is_peak_time: bool


class NoShowRiskResponse(BaseModel):
    queue_entry_id: UUID
    risk_bucket: RiskBucket
    risk_score: float
    recommended_action: str


class SMSComposeRequest(BaseModel):
    location_name: str
    guest_first_name: Optional[str] = None
    eta_low_min: int
    eta_high_min: int
    include_stop_text: bool = True


class SMSComposeResponse(BaseModel):
    sms_text: str
    char_count: int


class QueueEntry(SQLModel, table=False):
    id: UUID = Field(default_factory=uuid4)
    location_id: UUID
    status: QueueStatus = QueueStatus.WAITING
    party_size: int
    seating_preference: Optional[str] = None
    phone_e164: str
    eta_low_min: Optional[int] = None
    eta_high_min: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QueueSnapshotResponse(BaseModel):
    location_id: UUID
    total_waiting: int
    entries: List[QueueEntry]
