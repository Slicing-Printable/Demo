"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Container, Typography } from "@mui/material";

import { JobsGrid } from "@/components/JobsGrid";
import { OverridesDrawer } from "@/components/OverridesDrawer";
import type { Installer, Job, Override } from "@/lib/api";
import { fetchInstallers, fetchJobs } from "@/lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsData, installersData] = await Promise.all([fetchJobs(), fetchInstallers()]);
        setJobs(jobsData);
        setInstallers(installersData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Jobs
        </Typography>
        <JobsGrid jobs={jobs} onOpen={setSelectedJob} />
        <OverridesDrawer
          job={selectedJob}
          installers={installers}
          overrides={overrides}
          onClose={(updated) => {
            if (updated) {
              setOverrides(updated);
            }
            setSelectedJob(null);
          }}
        />
      </Container>
    </main>
  );
}
