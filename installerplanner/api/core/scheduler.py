"""Simple greedy scheduling stub."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from typing import Iterable, List

from .models import Installer, Job, Override, ScheduleItem


def _week_start(reference: date | None = None) -> date:
    reference = reference or date.today()
    return reference - timedelta(days=reference.weekday())


def _apply_override(
    job: Job,
    override: Override,
    installers: dict[str, Installer],
) -> ScheduleItem | None:
    installer = installers.get(override.installer_id)
    if not installer:
        return None
    end_date = override.start_date + timedelta(days=job.duration_days - 1)
    return ScheduleItem(
        job_id=job.job_id,
        job_name=job.name,
        installer_id=installer.id,
        installer_name=installer.name,
        start_date=override.start_date,
        end_date=end_date,
        duration_days=job.duration_days,
        revenue=job.revenue,
        revenue_bucket=job.revenue_bucket,
    )


def build_schedule(
    installers: Iterable[Installer],
    jobs: Iterable[Job],
    overrides: Iterable[Override],
    reference_date: date | None = None,
) -> List[ScheduleItem]:
    """Return a naive, non-overlapping schedule for the given week."""

    installer_map = {inst.id: inst for inst in installers}
    week_start = _week_start(reference_date)
    week_end = week_start + timedelta(days=6)

    overrides_by_job = {ov.job_id: ov for ov in overrides}
    bookings: dict[str, set[date]] = defaultdict(set)
    scheduled: List[ScheduleItem] = []

    # Handle overrides first
    for job in jobs:
        if job.job_id in overrides_by_job:
            item = _apply_override(job, overrides_by_job[job.job_id], installer_map)
            if item:
                for offset in range(job.duration_days):
                    bookings[item.installer_id].add(item.start_date + timedelta(days=offset))
                scheduled.append(item)

    remaining_jobs = [job for job in jobs if job.job_id not in overrides_by_job]
    remaining_jobs.sort(key=lambda j: (-j.revenue, j.job_id))

    for job in remaining_jobs:
        placed = False
        for installer in installer_map.values():
            for offset in range(0, 7):
                candidate_start = week_start + timedelta(days=offset)
                candidate_end = candidate_start + timedelta(days=job.duration_days - 1)
                if candidate_end > week_end:
                    continue

                span = {candidate_start + timedelta(days=i) for i in range(job.duration_days)}
                if span & bookings[installer.id]:
                    continue

                bookings[installer.id].update(span)
                scheduled.append(
                    ScheduleItem(
                        job_id=job.job_id,
                        job_name=job.name,
                        installer_id=installer.id,
                        installer_name=installer.name,
                        start_date=candidate_start,
                        end_date=candidate_end,
                        duration_days=job.duration_days,
                        revenue=job.revenue,
                        revenue_bucket=job.revenue_bucket,
                    )
                )
                placed = True
                break
            if placed:
                break
        # TODO: Implement spill-over weeks or backlog handling for unplaced jobs.

    scheduled.sort(key=lambda item: (item.start_date, item.installer_name, item.job_name))
    return scheduled


