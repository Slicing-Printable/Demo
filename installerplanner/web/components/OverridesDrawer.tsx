"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";

import type { Installer, Job, Override } from "@/lib/api";
import { saveOverrides } from "@/lib/api";

interface Props {
  job: Job | null;
  installers: Installer[];
  overrides: Override[];
  onClose: (overrides: Override[] | null) => void;
}

export function OverridesDrawer({ job, installers, overrides, onClose }: Props) {
  const [installerId, setInstallerId] = useState<string>(job ? installers[0]?.id ?? "" : "");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const defaultInstallerId = useMemo(() => installers[0]?.id ?? "", [installers]);

  useEffect(() => {
    if (job) {
      const existing = overrides.find((o) => o.job_id === job.job_id);
      setInstallerId(existing?.installer_id ?? defaultInstallerId);
      setStartDate(existing?.start_date ?? new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [job, overrides, defaultInstallerId]);

  if (!job) {
    return null;
  }

  const handleSave = async () => {
    if (!installerId || !startDate) {
      setError("Installer and start date are required");
      return;
    }

    const updated: Override[] = overrides.filter((o) => o.job_id !== job.job_id).concat({
      job_id: job.job_id,
      installer_id: installerId,
      start_date: startDate
    });

    try {
      const saved = await saveOverrides(updated);
      onClose(saved);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Drawer anchor="right" open={Boolean(job)} onClose={() => onClose(null)}>
      <Box sx={{ width: 360, p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">Create Override</Typography>
        <Typography variant="body2" color="text.secondary">
          {job.name} ({job.job_id})
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <FormControl fullWidth>
          <InputLabel id="installer-select-label">Installer</InputLabel>
          <Select
            labelId="installer-select-label"
            value={installerId}
            label="Installer"
            onChange={(event) => setInstallerId(event.target.value)}
          >
            {installers.map((installer) => (
              <MenuItem key={installer.id} value={installer.id}>
                {installer.name} ({installer.tier})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
          <Button variant="text" onClick={() => onClose(null)}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
