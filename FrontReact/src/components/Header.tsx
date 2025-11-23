import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth-store';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleLogout = () => {
    logout();
    enqueueSnackbar('You have been successfully signed out', {
      variant: 'info',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
    navigate('/');
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(25px)',
        borderRadius: 2,
        margin: '16px auto',
        maxWidth: '95%',
        width: 'fit-content',
        minWidth: '600px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 6px 25px rgba(126, 87, 194, 0.18)',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: 4,
          minHeight: '70px !important',
          padding: '0 32px !important',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(126, 87, 194, 0.3)',
            }}
          >
            {
              <img
                src="/icons/grape.png"
                alt="SubscriptionManager Logo"
                style={{
                  width: '80%',
                  height: '80%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            }
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.3rem',
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SubscriptionManager
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  color: '#7E57C2',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1rem',
                }}
              >
                Welcome, {user?.email}!
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/profile')}
                sx={{
                  color: '#7E57C2',
                  borderColor: '#7E57C2',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '8px 20px',
                  minWidth: 'auto',
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#5E35B1',
                    backgroundColor: 'rgba(126, 87, 194, 0.08)',
                    borderWidth: '2px',
                  },
                }}
              >
                Profile
              </Button>
              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  color: '#7E57C2',
                  borderColor: '#7E57C2',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '6px 16px',
                  minWidth: 'auto',
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#5E35B1',
                    backgroundColor: 'rgba(126, 87, 194, 0.08)',
                    borderWidth: '2px',
                  },
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => navigate('/auth?form=signin')}
                sx={{
                  color: '#7E57C2',
                  borderColor: '#7E57C2',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '8px 24px',
                  minWidth: 'auto',
                  borderWidth: '2px',
                  '&:hover': {
                    borderColor: '#5E35B1',
                    backgroundColor: 'rgba(126, 87, 194, 0.08)',
                    borderWidth: '2px',
                  },
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/auth?form=signup')}
                sx={{
                  background:
                    'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '8px 24px',
                  minWidth: 'auto',
                  boxShadow: '0 4px 15px rgba(126, 87, 194, 0.4)',
                  border: '2px solid transparent',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(126, 87, 194, 0.5)',
                    background:
                      'linear-gradient(135deg, #5E35B1 0%, #7E57C2 100%)',
                  },
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
