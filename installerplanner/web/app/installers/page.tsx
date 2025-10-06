import { Container, Typography } from "@mui/material";

import { fetchInstallers } from "@/lib/api";
import { InstallersTable } from "@/components/InstallersTable";

export default async function InstallersPage() {
  const installers = await fetchInstallers();

  return (
    <main>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Installers
        </Typography>
        <InstallersTable installers={installers} />
      </Container>
    </main>
  );
}
