import { createTheme } from '@mui/material/styles';

const theme = createTheme({
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
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#5E35B1',
    },
    h5: {
      fontWeight: 600,
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
          fontWeight: 600,
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
          fontWeight: 600,
          marginBottom: '8px',
        },
      },
    },
  },
});

export default theme;
