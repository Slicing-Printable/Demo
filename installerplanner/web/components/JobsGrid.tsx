"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, TextField } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

import type { Job } from "@/lib/api";
import { revenueFormatter } from "@/lib/api";

interface Props {
  jobs: Job[];
  onOpen: (job: Job) => void;
}

export function JobsGrid({ jobs, onOpen }: Props) {
  const [quickFilter, setQuickFilter] = useState("");

  const columns: ColDef<Job>[] = useMemo(
    () => [
      { field: "job_id", headerName: "Job ID", flex: 1 },
      { field: "name", headerName: "Name", flex: 1.5 },
      {
        field: "revenue",
        headerName: "Revenue",
        flex: 1,
        valueFormatter: ({ value }) => revenueFormatter(value as number)
      },
      { field: "revenue_bucket", headerName: "Revenue Bucket", flex: 1 },
      { field: "duration_days", headerName: "Duration (days)", flex: 1 },
      { field: "city", headerName: "City", flex: 1 }
    ],
    []
  );

  const onRowDoubleClicked = useCallback(
    (event: any) => {
      if (event?.data) {
        onOpen(event.data as Job);
      }
    },
    [onOpen]
  );

  return (
    <Box>
      <TextField
        label="Quick filter"
        value={quickFilter}
        onChange={(event) => setQuickFilter(event.target.value)}
        sx={{ mb: 2 }}
        fullWidth
      />
      <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          rowData={jobs}
          columnDefs={columns}
          domLayout="normal"
          animateRows
          onRowDoubleClicked={onRowDoubleClicked}
          quickFilterText={quickFilter}
        />
      </div>
    </Box>
  );
}
