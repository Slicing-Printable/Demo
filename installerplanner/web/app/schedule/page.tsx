"use client";

import { useState } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

import { WeekCalendar } from "@/components/WeekCalendar";
import type { ScheduleItem } from "@/lib/api";
import { buildSchedule, publishToTeams } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBuild = async () => {
    setLoading(true);
    try {
      const schedule = await buildSchedule();
      setItems(schedule);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!items.length) {
      alert("Build a schedule before publishing.");
      return;
    }
    const webhook = window.prompt("Enter the Microsoft Teams webhook URL");
    if (!webhook) return;
    await publishToTeams({
      webhook_url: webhook,
      title: "Weekly Installation Schedule",
      lines: items.map((item) => `${item.job_name} – ${item.installer_name} (${item.start_date})`),
      ics_url: `${API_BASE}/export/ics`
    });
    alert("Schedule published to Teams");
  };

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Schedule</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleBuild} disabled={loading}>
              {loading ? "Building..." : "Build Schedule"}
            </Button>
            <Button variant="outlined" onClick={handlePublish}>
              Publish to Teams
            </Button>
          </Box>
        </Stack>
        <Box sx={{ mt: 4, backgroundColor: "white", p: 2, borderRadius: 1 }}>
          {items.length ? (
            <WeekCalendar items={items} />
          ) : (
            <Typography variant="body1" color="text.secondary">
              Click “Build Schedule” to generate events for this week.
            </Typography>
          )}
        </Box>
      </Container>
    </main>
  );
}
