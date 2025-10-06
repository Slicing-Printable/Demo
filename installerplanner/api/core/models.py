"""Data models for InstallPlanner backend."""
from __future__ import annotations

from datetime import date
from typing import List

from pydantic import BaseModel, Field, validator


class Installer(BaseModel):
    """Represents an installer that can be scheduled."""

    id: str = Field(..., description="Unique identifier for the installer")
    name: str = Field(..., description="Display name")
    tier: str = Field(..., description="Business tier classification")
    match_score: float = Field(0.0, description="Placeholder score for matching quality")


class Job(BaseModel):
    """Represents a job that must be scheduled."""

    job_id: str = Field(..., description="Unique job identifier")
    name: str = Field(..., description="Job description")
    revenue: float = Field(..., ge=0, description="Total revenue for the job")
    duration_days: int = Field(..., ge=1, description="Number of days required")
    city: str = Field(..., description="City where the job takes place")

    @property
    def revenue_bucket(self) -> str:
        """Bucket the revenue into predefined ranges."""

        amount = self.revenue
        if amount < 10_000:
            return "0-10k"
        if amount < 50_000:
            return "10-50k"
        if amount < 100_000:
            return "50-100k"
        if amount < 200_000:
            return "100-200k"
        return "200-300k"


class Override(BaseModel):
    """Manual override for placing a job."""

    job_id: str
    installer_id: str
    start_date: date


class ScheduleItem(BaseModel):
    """Represents a single scheduled job placement."""

    job_id: str
    job_name: str
    installer_id: str
    installer_name: str
    start_date: date
    end_date: date
    duration_days: int
    revenue: float
    revenue_bucket: str

    @validator("end_date")
    def validate_dates(cls, end_date: date, values: dict[str, object]) -> date:
        start_date = values.get("start_date")
        if isinstance(start_date, date) and end_date < start_date:
            raise ValueError("end_date must be on or after start_date")
        return end_date


class ScheduleResponse(BaseModel):
    """Wrapper for returning both data and metadata for schedules."""

    items: List[ScheduleItem]
    generated_at: date


