import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Divider,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  Card,
  Alert,
  CircularProgress,
  Fade,
  Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AccountCircle,
} from '@mui/icons-material';
import { authService } from '../services/auth-service';
import { LoginRequest } from '../types/auth';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

const GlassCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(5),
  gap: theme.spacing(4),
  margin: 'auto',
  maxWidth: '440px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '24px',
  boxShadow: `
    0 8px 32px rgba(126, 87, 194, 0.1),
    0 2px 8px rgba(126, 87, 194, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6)
  `,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(90deg, #7E57C2 0%, #B39DDB 50%, #CE93D8 100%)',
  },
}));

const AuthContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  justifyContent: 'center',
  alignItems: 'center',
  background: `
    radial-gradient(ellipse at top right, rgba(179, 157, 219, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(206, 147, 216, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #F8F5FF 0%, #F3E5F5 50%, #E8EAF6 100%)
  `,
  position: 'relative',
}));

const FloatingShape = styled(Box)(({}) => ({
  position: 'absolute',
  borderRadius: '50%',
  background:
    'linear-gradient(45deg, rgba(126, 87, 194, 0.1), rgba(179, 157, 219, 0.05))',
  animation: 'float 6s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(180deg)' },
  },
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

const LogoIcon = styled(Box)(({}) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '18px',
  boxShadow: '0 4px 12px rgba(126, 87, 194, 0.3)',
}));

const StyledTextField = styled(TextField)(({}) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      boxShadow: '0 0 0 2px rgba(126, 87, 194, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#666',
  },
}));

const GradientButton = styled(Button)(({}) => ({
  background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(126, 87, 194, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(126, 87, 194, 0.4)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

interface SignInProps {
  onToggleMode: () => void;
  onShowForgotPassword: () => void;
}

export const SignIn: React.FC<SignInProps> = ({
  onToggleMode,
  onShowForgotPassword,
}) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (e.target.name === 'email') {
      setEmailError(false);
      setEmailErrorMessage('');
    }
    if (e.target.name === 'password') {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }
    setError('');
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const validateInputs = (): boolean => {
    let isValid = true;

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    }

    if (!formData.password || formData.password.length < 1) {
      setPasswordError(true);
      setPasswordErrorMessage('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.login(formData);

      if (result.success) {
        enqueueSnackbar('🎉 Successfully signed in!', {
          variant: 'success',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.title || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer direction="column">
      {/* Floating Background Shapes */}
      <FloatingShape
        sx={{ top: '10%', right: '10%', width: '200px', height: '200px' }}
      />
      <FloatingShape
        sx={{
          bottom: '15%',
          left: '8%',
          width: '150px',
          height: '150px',
          animationDelay: '2s',
        }}
      />
      <FloatingShape
        sx={{
          top: '30%',
          left: '15%',
          width: '100px',
          height: '100px',
          animationDelay: '4s',
        }}
      />

      <Zoom in={true} timeout={800}>
        <GlassCard>
          <Logo>
            <LogoIcon>SM</LogoIcon>
            <Typography
              variant="h5"
              sx={{
                color: '#7E57C2',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SubscriptionManager
            </Typography>
          </Logo>

          <Fade in={true} timeout={1000}>
            <Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  textAlign: 'center',
                  mb: 1,
                  fontWeight: 700,
                  background:
                    'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Welcome Back
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  textAlign: 'center',
                  color: 'text.secondary',
                  mb: 4,
                  fontSize: '1.1rem',
                }}
              >
                Sign in to manage your subscriptions
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'error.light',
                    background: 'rgba(244, 67, 54, 0.05)',
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  gap: 3,
                }}
              >
                <FormControl>
                  <FormLabel
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                  >
                    Email Address
                  </FormLabel>
                  <StyledTextField
                    error={emailError}
                    helperText={emailErrorMessage}
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <Email sx={{ color: '#7E57C2', mr: 1 }} />
                      ),
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                  >
                    Password
                  </FormLabel>
                  <StyledTextField
                    error={passwordError}
                    helperText={passwordErrorMessage}
                    name="password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <Lock sx={{ color: '#7E57C2', mr: 1 }} />,
                      endAdornment: (
                        <Button
                          size="small"
                          onClick={handleClickShowPassword}
                          sx={{ minWidth: 'auto', color: '#7E57C2' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      ),
                    }}
                  />
                </FormControl>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked
                        sx={{
                          color: '#7E57C2',
                          '&.Mui-checked': {
                            color: '#7E57C2',
                          },
                        }}
                      />
                    }
                    label="Remember me"
                  />
                  <Link
                    component="button"
                    type="button"
                    onClick={onShowForgotPassword}
                    variant="body2"
                    sx={{
                      color: '#7E57C2',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <GradientButton
                  type="submit"
                  fullWidth
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </GradientButton>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', px: 2 }}
                >
                  Don't have an account?
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={onToggleMode}
                size="large"
                startIcon={<AccountCircle />}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  borderColor: '#7E57C2',
                  color: '#7E57C2',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#5E35B1',
                    backgroundColor: 'rgba(126, 87, 194, 0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(126, 87, 194, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Create Account
              </Button>
            </Box>
          </Fade>
        </GlassCard>
      </Zoom>
    </AuthContainer>
  );
};
