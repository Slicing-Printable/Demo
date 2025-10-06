import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import Link from "next/link";

import { fetchInstallers, fetchJobs } from "@/lib/api";

export default async function HomePage() {
  const [installers, jobs] = await Promise.all([fetchInstallers(), fetchJobs()]);

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h3" gutterBottom>
          InstallPlanner Dashboard
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Installers</Typography>
                <Typography variant="h3" color="primary">
                  {installers.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Jobs</Typography>
                <Typography variant="h3" color="primary">
                  {jobs.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
          <Button component={Link} href="/jobs" variant="contained" color="primary">
            View Jobs
          </Button>
          <Button component={Link} href="/schedule" variant="outlined" color="primary">
            View Schedule
          </Button>
        </Box>
      </Container>
    </main>
  );
}
