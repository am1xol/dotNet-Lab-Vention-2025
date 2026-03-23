import React, { useCallback, useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../../store/auth-store';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notification-service';
import { translations } from '../../i18n/translations';

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [, setUnreadCount] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const updateCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getUserNotifications(1, 100);
      const count = data.items.filter((n: any) => !n.isRead).length;

      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch notification count');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    updateCount();

    const id = setInterval(updateCount, 30000);

    return () => {
      clearInterval(id);
    };
  }, [isAuthenticated, updateCount]);

  const handleLogout = () => {
    logout();
    enqueueSnackbar(translations.messages.signedOut, {
      variant: 'info',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
    navigate('/');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(25px)',
        borderRadius: 2,
        margin: '16px auto',
        maxWidth: isMobile ? '98%' : '95%',
        width: isMobile ? '98%' : 'fit-content',
        minWidth: isMobile ? 'auto' : '600px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 6px 25px rgba(126, 87, 194, 0.18)',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          gap: 2,
          minHeight: isMobile ? '56px !important' : '70px !important',
          padding: isMobile ? '0 12px !important' : '0 32px !important',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: isMobile ? '12px' : '16px',
              boxShadow: '0 4px 12px rgba(126, 87, 194, 0.3)',
            }}
          >
            {
              <img
                src="/icons/grape.png"
                alt="Logo"
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
              fontSize: isMobile ? '1rem' : '1.3rem',
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SubscriptionManager
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
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
                  {translations.common.welcome}, {user?.email}!
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
                  {translations.common.profile}
                </Button>
                {user?.role === 'Admin' && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin')}
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
                    {translations.common.adminPanel}
                  </Button>
                )}
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
                  {translations.common.logout}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/auth/signin')}
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
                  {translations.common.signIn}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth/signup')}
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
                  {translations.common.signUp}
                </Button>
              </>
            )}
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            onClick={handleMenuOpen}
            sx={{ color: '#7E57C2' }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Mobile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(126, 87, 194, 0.1)' }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SubscriptionManager
          </Typography>
        </Box>
        {isAuthenticated ? (
          <>
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              <Typography sx={{ fontWeight: 600, color: '#7E57C2' }}>
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              {translations.common.profile}
            </MenuItem>
            {user?.role === 'Admin' && (
              <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
                {translations.common.adminPanel}
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
              {translations.common.logout}
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => { navigate('/auth/signin'); handleMenuClose(); }}>
              {translations.common.signIn}
            </MenuItem>
            <MenuItem onClick={() => { navigate('/auth/signup'); handleMenuClose(); }}>
              {translations.common.signUp}
            </MenuItem>
          </>
        )}
      </Menu>
    </AppBar>
  );
};

export default Header;
