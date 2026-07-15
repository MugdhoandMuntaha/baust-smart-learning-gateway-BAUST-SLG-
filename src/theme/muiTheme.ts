"use client";

import { createTheme } from "@mui/material/styles";

const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#006B3F",
      light: "#00895a",
      dark: "#004d2d",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#FFD700",
      light: "#FFE44D",
      dark: "#C9A800",
      contrastText: "#1A202C",
    },
    info: {
      main: "#1B4F72",
      light: "#2471A3",
      dark: "#1F3A60",
    },
    error: {
      main: "#DC2626",
    },
    warning: {
      main: "#F59E0B",
    },
    success: {
      main: "#16A34A",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A202C",
      secondary: "#4A5568",
    },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h3: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
          fontSize: "0.875rem",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0, 107, 63, 0.2)",
          },
          "&.MuiButton-containedPrimary": {
            background: "linear-gradient(135deg, #006B3F 0%, #00895a 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #004d2d 0%, #006B3F 100%)",
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#006B3F",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#006B3F",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
});

export default muiTheme;
