"use client";

import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import type { Installer } from "@/lib/api";

interface Props {
  installers: Installer[];
}

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "tier", headerName: "Tier", flex: 1 },
  {
    field: "match_score",
    headerName: "Match Score",
    flex: 1,
    valueFormatter: ({ value }) => `${value}%`
  }
];

export function InstallersTable({ installers }: Props) {
  return (
    <Box sx={{ height: 500, width: "100%", backgroundColor: "white" }}>
      <DataGrid rows={installers} columns={columns} getRowId={(row) => row.id} disableRowSelectionOnClick />
    </Box>
  );
}
