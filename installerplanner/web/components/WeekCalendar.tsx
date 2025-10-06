"use client";

import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventInput } from "@fullcalendar/core";

import type { ScheduleItem } from "@/lib/api";


interface Props {
  items: ScheduleItem[];
}

export function WeekCalendar({ items }: Props) {
  const events: EventInput[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.job_id,
        title: `${item.job_name} (${item.installer_name})`,
        start: item.start_date,
        end: (() => {
          const end = new Date(item.end_date);
          end.setDate(end.getDate() + 1);
          return end;
        })(),
        allDay: true,
        extendedProps: item
      })),
    [items]
  );

  const renderEventContent = (arg: EventContentArg) => {
    return (
      <div title={`${arg.event.extendedProps.revenue_bucket} • ${arg.event.extendedProps.duration_days} day(s)`}>
        <strong>{arg.event.title}</strong>
      </div>
    );
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridWeek"
      events={events}
      headerToolbar={{ left: "", center: "", right: "" }}
      eventContent={renderEventContent}
      height="auto"
    />
  );
}
