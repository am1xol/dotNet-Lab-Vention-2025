import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily:
      '"Klavika Basic", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 700,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body1: {
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontWeight: 700,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
    caption: {
      fontWeight: 700,
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontWeight: 700,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      textTransform: 'uppercase',
    },
  },
  palette: {
    primary: {
      main: '#7E57C2',
      light: '#B39DDB',
      dark: '#5E35B1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#CE93D8',
      light: '#E1BEE7',
      dark: '#AB47BC',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F3FF',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 700,
          padding: '12px 24px',
          boxShadow: '0 4px 14px 0 rgba(126, 87, 194, 0.2)',
          '&:hover': {
            boxShadow: '0 6px 20px 0 rgba(126, 87, 194, 0.3)',
          },
        },
        outlined: {
          boxShadow: 'none',
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 10px 40px rgba(126, 87, 194, 0.1)',
          border: '1px solid rgba(126, 87, 194, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': {
              borderColor: '#7E57C2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7E57C2',
            },
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#5E35B1',
          fontWeight: 700,
          marginBottom: '8px',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily:
            '"Klavika Basic", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
  },
});

export default theme;
