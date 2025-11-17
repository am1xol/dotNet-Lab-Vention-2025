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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuthStore } from '../store/auth-store';
import { authService } from '../services/auth-service';
import { LoginRequest } from '../types/auth';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(6),
  gap: theme.spacing(3),
  margin: 'auto',
  maxWidth: '480px',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F5FF 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #7E57C2 0%, #B39DDB 50%, #CE93D8 100%)',
  },
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '10%',
    right: '10%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #B39DDB, transparent)',
    opacity: 0.1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '10%',
    left: '10%',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #CE93D8, transparent)',
    opacity: 0.1,
  },
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const LogoIcon = styled(Box)(({}) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '14px',
}));

interface SignInProps {
  onToggleMode: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const login = useAuthStore((state) => state.login);

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

      if (result.success && result.accessToken && result.refreshToken) {
        const userData = {
          email: formData.email,
        };

        login(userData, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
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
    <SignInContainer direction="column">
      <StyledCard>
        <Logo>
          <LogoIcon>SM</LogoIcon>
          <Typography variant="h6" sx={{ color: '#7E57C2', fontWeight: 700 }}>
            SubscriptionManager
          </Typography>
        </Logo>

        <Typography
          component="h1"
          variant="h4"
          sx={{
            textAlign: 'center',
            mb: 1,
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Welcome Back
        </Typography>

        <Typography
          variant="body1"
          sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}
        >
          Sign in to your account to continue
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'error.light',
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
            gap: 2.5,
          }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email Address</FormLabel>
            <TextField
              error={emailError}
              helperText={emailErrorMessage}
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="Enter your password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            size="large"
            sx={{
              mt: 2,
              py: 1.5,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
            New to us?
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onToggleMode}
            size="large"
            sx={{
              borderColor: '#7E57C2',
              color: '#7E57C2',
              '&:hover': {
                borderColor: '#5E35B1',
                backgroundColor: 'rgba(126, 87, 194, 0.04)',
              },
            }}
          >
            Create Account
          </Button>
        </Box>
      </StyledCard>
    </SignInContainer>
  );
};
