"""Excel import/export helpers."""
from __future__ import annotations

from io import BytesIO
from typing import Iterable, List, Tuple

import pandas as pd

from .models import Installer, Job, Override


INSTALLERS_SHEET = "Installers"
JOBS_SHEET = "Jobs"
OVERRIDES_SHEET = "Overrides"


def _installers_to_frame(installers: Iterable[Installer]) -> pd.DataFrame:
    data = [i.dict() for i in installers]
    return pd.DataFrame(data or [], columns=["id", "name", "tier", "match_score"])


def _jobs_to_frame(jobs: Iterable[Job]) -> pd.DataFrame:
    data = [
        {
            "job_id": job.job_id,
            "name": job.name,
            "revenue": job.revenue,
            "duration_days": job.duration_days,
            "city": job.city,
            "revenue_bucket": job.revenue_bucket,
        }
        for job in jobs
    ]
    return pd.DataFrame(
        data or [],
        columns=["job_id", "name", "revenue", "duration_days", "city", "revenue_bucket"],
    )


def _overrides_to_frame(overrides: Iterable[Override]) -> pd.DataFrame:
    data = [o.dict() for o in overrides]
    return pd.DataFrame(data or [], columns=["job_id", "installer_id", "start_date"])


def export_workbook(
    installers: Iterable[Installer],
    jobs: Iterable[Job],
    overrides: Iterable[Override],
) -> bytes:
    """Return bytes for an XLSX workbook with the planner data."""

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
        _installers_to_frame(installers).to_excel(writer, sheet_name=INSTALLERS_SHEET, index=False)
        _jobs_to_frame(jobs).to_excel(writer, sheet_name=JOBS_SHEET, index=False)
        _overrides_to_frame(overrides).to_excel(writer, sheet_name=OVERRIDES_SHEET, index=False)
    buffer.seek(0)
    return buffer.read()


def import_workbook(data: bytes) -> Tuple[List[Installer], List[Job], List[Override]]:
    """Parse an XLSX workbook and return domain models."""

    buffer = BytesIO(data)
    frames = pd.read_excel(
        buffer,
        sheet_name=[INSTALLERS_SHEET, JOBS_SHEET, OVERRIDES_SHEET],
        dtype={"match_score": float, "revenue": float, "duration_days": int},
    )

    installers = [Installer(**row) for row in frames[INSTALLERS_SHEET].fillna("").to_dict("records")]

    job_records = frames[JOBS_SHEET].fillna({"city": "", "name": ""}).to_dict("records")
    jobs = [
        Job(
            job_id=str(row["job_id"]),
            name=str(row["name"]),
            revenue=float(row["revenue"]),
            duration_days=int(row["duration_days"]),
            city=str(row.get("city", "")),
        )
        for row in job_records
    ]

    override_records = frames[OVERRIDES_SHEET].dropna(subset=["job_id", "installer_id"]).to_dict("records")
    overrides = [
        Override(
            job_id=str(row["job_id"]),
            installer_id=str(row["installer_id"]),
            start_date=pd.to_datetime(row["start_date"]).date(),
        )
        for row in override_records
    ]

    return installers, jobs, overrides


