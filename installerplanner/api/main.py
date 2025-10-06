"""FastAPI application for InstallPlanner."""
from __future__ import annotations

import os
from datetime import date
from typing import List, Optional

import requests
from fastapi import BackgroundTasks, Depends, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from core import excel_io, ics_export, scheduler
from core.models import Installer, Job, Override, ScheduleItem


class ScheduleRequest(BaseModel):
    """Request payload for building a schedule."""

    reference_date: Optional[date] = None
    include_overrides: bool = True


class TeamsPublishRequest(BaseModel):
    """Payload for publishing to Microsoft Teams."""

    webhook_url: str
    title: str
    lines: List[str]
    ics_url: str


class DataStore:
    """A very small in-memory persistence layer."""

    def __init__(self) -> None:
        self.installers: List[Installer] = []
        self.jobs: List[Job] = []
        self.overrides: List[Override] = []

    def seed(self) -> None:
        """Populate the store with sample data when requested."""

        if self.installers or self.jobs:
            return

        self.installers = [
            Installer(id="inst-100", name="Acme Installers", tier="Gold", match_score=92.0),
            Installer(id="inst-101", name="BrightBuild", tier="Silver", match_score=85.0),
            Installer(id="inst-102", name="Crafted Homes", tier="Bronze", match_score=78.0),
        ]
        self.jobs = [
            Job(job_id="JOB-001", name="Rooftop Solar", revenue=150_000, duration_days=3, city="Denver"),
            Job(job_id="JOB-002", name="Battery Storage", revenue=80_000, duration_days=2, city="Boulder"),
            Job(job_id="JOB-003", name="EV Charger", revenue=12_000, duration_days=1, city="Aurora"),
            Job(job_id="JOB-004", name="Panel Upgrade", revenue=45_000, duration_days=2, city="Fort Collins"),
            Job(job_id="JOB-005", name="Commercial Solar", revenue=250_000, duration_days=4, city="Colorado Springs"),
        ]
        self.overrides = [
            Override(job_id="JOB-003", installer_id="inst-102", start_date=date.today()),
        ]


store = DataStore()
if os.getenv("SEED", "0") == "1":
    store.seed()

app = FastAPI(title="InstallPlanner API", version="0.1.0")

web_origin = os.getenv("WEB_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[web_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_store() -> DataStore:
    """Dependency that returns the global datastore."""

    return store


@app.get("/installers", response_model=List[Installer])
async def list_installers(store: DataStore = Depends(get_store)) -> List[Installer]:
    """Return all installers with placeholder match scores."""

    return store.installers


@app.get("/jobs", response_model=List[Job])
async def list_jobs(q: Optional[str] = None, store: DataStore = Depends(get_store)) -> List[Job]:
    """Return jobs, optionally filtered by a query string."""

    if not q:
        return store.jobs

    term = q.lower()
    return [
        job
        for job in store.jobs
        if term in job.job_id.lower()
        or term in job.name.lower()
        or term in job.city.lower()
    ]


@app.post("/overrides", response_model=List[Override])
async def save_overrides(payload: List[Override], store: DataStore = Depends(get_store)) -> List[Override]:
    """Persist override selections for manual scheduling."""

    store.overrides = payload
    return store.overrides


@app.post("/schedule", response_model=List[ScheduleItem])
async def build_schedule_endpoint(
    payload: ScheduleRequest | None = None,
    store: DataStore = Depends(get_store),
) -> List[ScheduleItem]:
    """Return a computed schedule for the requested week."""

    payload = payload or ScheduleRequest()
    overrides = store.overrides if payload.include_overrides else []
    return scheduler.build_schedule(store.installers, store.jobs, overrides, payload.reference_date)


@app.post("/import/xlsx")
async def import_xlsx(file: UploadFile = File(...), store: DataStore = Depends(get_store)) -> JSONResponse:
    """Import planner data from an uploaded workbook."""

    data = await file.read()
    installers, jobs, overrides = excel_io.import_workbook(data)
    store.installers = installers
    store.jobs = jobs
    store.overrides = overrides
    return JSONResponse({"status": "ok", "installers": len(installers), "jobs": len(jobs)})


@app.get("/export/xlsx")
async def export_xlsx(store: DataStore = Depends(get_store)) -> Response:
    """Export the planner data to an Excel workbook."""

    workbook = excel_io.export_workbook(store.installers, store.jobs, store.overrides)
    return Response(
        content=workbook,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=installplanner.xlsx"},
    )


@app.get("/export/ics")
async def export_ics(store: DataStore = Depends(get_store)) -> Response:
    """Export the current schedule as an ICS file."""

    schedule_items = scheduler.build_schedule(store.installers, store.jobs, store.overrides)
    ics_bytes = ics_export.build_ics(schedule_items)
    return Response(
        content=ics_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=installplanner.ics"},
    )


@app.post("/teams/publish")
async def publish_to_teams(
    payload: TeamsPublishRequest,
    background_tasks: BackgroundTasks,
) -> JSONResponse:
    """Send an Adaptive Card to a Microsoft Teams webhook."""

    def _post_card() -> None:
        card = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "content": {
                        "type": "AdaptiveCard",
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "version": "1.4",
                        "body": [
                            {"type": "TextBlock", "weight": "Bolder", "size": "Large", "text": payload.title},
                            {
                                "type": "TextBlock",
                                "wrap": True,
                                "text": "\n".join(payload.lines),
                            },
                        ],
                        "actions": [
                            {
                                "type": "Action.OpenUrl",
                                "title": "Download ICS",
                                "url": payload.ics_url,
                            }
                        ],
                    },
                }
            ],
        }
        try:
            requests.post(payload.webhook_url, json=card, timeout=5)
        except requests.RequestException:
            pass  # For now we swallow errors; future versions should log.

    background_tasks.add_task(_post_card)
    return JSONResponse({"status": "queued"})


