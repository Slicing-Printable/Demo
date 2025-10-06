import "@/app/globals.css";
import "@fullcalendar/daygrid/main.css";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { Metadata } from "next";
import { ReactNode } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0d47a1"
    },
    secondary: {
      main: "#ff8f00"
    }
  }
});

export const metadata: Metadata = {
  title: "InstallPlanner",
  description: "Plan installer schedules with ease"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
