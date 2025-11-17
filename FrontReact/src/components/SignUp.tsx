import React, { useState } from 'react';
import {
  Box,
  Button,
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
import { authService } from '../services/auth-service';
import { RegisterRequest } from '../types/auth';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  maxWidth: '450px',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  justifyContent: 'center',
  alignItems: 'center',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
}));

interface SignUpProps {
  onToggleMode: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'User'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (e.target.name === 'email') {
      setEmailError(false);
      setEmailErrorMessage('');
    }
    if (e.target.name === 'password') {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }
    if (e.target.name === 'firstName') setFirstNameError(false);
    if (e.target.name === 'lastName') setLastNameError(false);
    setError('');
  };

  const validateInputs = (): boolean => {
    let isValid = true;

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    }

    if (!formData.password || formData.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    }

    if (!formData.firstName || formData.firstName.length < 1) {
      setFirstNameError(true);
      isValid = false;
    }

    if (!formData.lastName || formData.lastName.length < 1) {
      setLastNameError(true);
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
      const result = await authService.register(formData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.title || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SignUpContainer direction="column">
        <StyledCard variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center', mb: 2 }}
          >
            Success!
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            Registration successful! Please check your email for verification code.
          </Alert>
          <Button
            fullWidth
            variant="outlined"
            onClick={onToggleMode}
          >
            Back to Sign In
          </Button>
        </StyledCard>
      </SignUpContainer>
    );
  }

  return (
    <SignUpContainer direction="column">
      <StyledCard variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center', mb: 2 }}
        >
          Sign up
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel htmlFor="firstName">First Name</FormLabel>
              <TextField
                error={firstNameError}
                helperText={firstNameError ? 'First name is required' : ''}
                id="firstName"
                name="firstName"
                placeholder="John"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel htmlFor="lastName">Last Name</FormLabel>
              <TextField
                error={lastNameError}
                helperText={lastNameError ? 'Last name is required' : ''}
                id="lastName"
                name="lastName"
                placeholder="Doe"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </FormControl>
          </Box>

          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
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
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Sign up'}
          </Button>
        </Box>

        <Divider>or</Divider>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link
              component="button"
              type="button"
              onClick={onToggleMode}
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </StyledCard>
    </SignUpContainer>
  );
};