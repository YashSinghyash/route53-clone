from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class HostedZoneCreate(BaseModel):
    name: str
    comment: Optional[str] = ""
    private_zone: Optional[bool] = False

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        v = (v or "").strip().rstrip(".")
        if not v:
            raise ValueError("name is required")
        labels = v.split(".")
        if len(labels) < 2 or any(not lbl for lbl in labels):
            raise ValueError("name must be a valid domain, e.g. example.com")
        return v

    @field_validator("comment")
    @classmethod
    def _default_comment(cls, v: Optional[str]) -> str:
        return v or ""


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None
    private_zone: Optional[bool] = None


class HostedZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    comment: str
    private_zone: bool
    record_count: int
    caller_reference: Optional[str] = None
    created_at: Optional[float] = None
    updated_at: Optional[float] = None
