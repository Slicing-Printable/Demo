"""ICS export helpers."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable

from dateutil import tz

from .models import ScheduleItem


def build_ics(schedule: Iterable[ScheduleItem], calendar_name: str = "InstallPlanner") -> bytes:
    """Generate an ICS payload from the provided schedule items."""

    tzinfo = tz.UTC
    now = datetime.now(tzinfo)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//InstallPlanner//EN",
        f"NAME:{calendar_name}",
        f"X-WR-CALNAME:{calendar_name}",
        "CALSCALE:GREGORIAN",
    ]

    for item in schedule:
        uid = f"{item.job_id}-{item.installer_id}@installplanner"

        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{now.strftime('%Y%m%dT%H%M%SZ')}",
                f"DTSTART;VALUE=DATE:{item.start_date.strftime('%Y%m%d')}",
                f"DTEND;VALUE=DATE:{(item.end_date + timedelta(days=1)).strftime('%Y%m%d')}",
                f"SUMMARY:{item.job_name} - {item.installer_name}",
                f"DESCRIPTION:Revenue bucket: {item.revenue_bucket}\\nDuration: {item.duration_days} day(s)",
                "END:VEVENT",
            ]
        )

    lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(lines) + "\r\n"
    return ics_content.encode("utf-8")


