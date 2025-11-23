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
import { RegisterRequest, VerifyEmailRequest } from '../types/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';

const AnimatedCardContent = styled(motion.div)({
  width: '100%',
});

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

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

interface SignUpProps {
  onToggleMode: () => void;
}

type SignUpStep = 'registration' | 'verification';

export const SignUp: React.FC<SignUpProps> = ({ onToggleMode }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [step, setStep] = useState<SignUpStep>('registration');
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'User',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [verificationCodeError, setVerificationCodeError] = useState(false);

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
    if (e.target.name === 'firstName') setFirstNameError(false);
    if (e.target.name === 'lastName') setLastNameError(false);
    setError('');
  };

  const handleVerificationCodeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVerificationCode(e.target.value);
    setVerificationCodeError(false);
    setError('');
  };

  const validateRegistrationInputs = (): boolean => {
    let isValid = true;

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    }

    if (!formData.password || formData.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(
        'The password must contain numbers, uppercase and lowercase letters.'
      );
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

  const validateVerificationInputs = (): boolean => {
    let isValid = true;

    if (!verificationCode || verificationCode.length < 1) {
      setVerificationCodeError(true);
      isValid = false;
    }

    return isValid;
  };

  const handleRegistrationSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validateRegistrationInputs()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.register(formData);

      if (result.success) {
        setStep('verification');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.title || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validateVerificationInputs()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const verifyData: VerifyEmailRequest = {
        email: formData.email,
        verificationCode: verificationCode,
      };

      const result = await authService.verifyEmail(
        verifyData.email,
        verifyData.verificationCode
      );

      if (result.success) {
        setSuccess(true);
        enqueueSnackbar('Email verified successfully! You can now sign in.', {
          variant: 'success',
        });
        setTimeout(() => {
          onToggleMode();
        }, 2000);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.title || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SignUpContainer direction="column">
        <StyledCard>
          <AnimatePresence mode="wait">
            <AnimatedCardContent
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              <Logo>
                <LogoIcon>SM</LogoIcon>
                <Typography
                  variant="h6"
                  sx={{ color: '#7E57C2', fontWeight: 700 }}
                >
                  SubscriptionManager
                </Typography>
              </Logo>

              <Typography
                component="h1"
                variant="h4"
                sx={{
                  width: '100%',
                  fontSize: 'clamp(2rem, 10vw, 2.15rem)',
                  textAlign: 'center',
                  mb: 2,
                }}
              >
                Email Verified!
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your email has been successfully verified! You can now sign in
                to your account.
              </Alert>
              <Button fullWidth variant="contained" onClick={onToggleMode}>
                Sign In
              </Button>
            </AnimatedCardContent>
          </AnimatePresence>
        </StyledCard>
      </SignUpContainer>
    );
  }

  if (step === 'verification') {
    return (
      <SignUpContainer direction="column">
        <StyledCard>
          <AnimatePresence mode="wait">
            <AnimatedCardContent
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Logo>
                <LogoIcon>SM</LogoIcon>
                <Typography
                  variant="h6"
                  sx={{ color: '#7E57C2', fontWeight: 700 }}
                >
                  SubscriptionManager
                </Typography>
              </Logo>

              <Typography
                component="h1"
                variant="h4"
                sx={{
                  width: '100%',
                  fontSize: 'clamp(2rem, 10vw, 2.15rem)',
                  textAlign: 'center',
                  mb: 2,
                }}
              >
                Verify Email
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleVerificationSubmit}
                noValidate
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  gap: 2,
                }}
              >
                <FormControl>
                  <FormLabel htmlFor="verificationCode">
                    Verification Code
                  </FormLabel>
                  <TextField
                    error={verificationCodeError}
                    helperText={
                      verificationCodeError
                        ? 'Verification code is required'
                        : ''
                    }
                    id="verificationCode"
                    name="verificationCode"
                    placeholder="Enter the code from your email"
                    value={verificationCode}
                    onChange={handleVerificationCodeChange}
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
                  {loading ? <CircularProgress size={24} /> : 'Verify Email'}
                </Button>
              </Box>

              <Divider />

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
            </AnimatedCardContent>
          </AnimatePresence>
        </StyledCard>
      </SignUpContainer>
    );
  }

  return (
    <SignUpContainer direction="column">
      <StyledCard>
        <AnimatePresence mode="wait">
          <AnimatedCardContent
            key="registration"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Logo>
              <LogoIcon>SM</LogoIcon>
              <Typography
                variant="h6"
                sx={{ color: '#7E57C2', fontWeight: 700 }}
              >
                SubscriptionManager
              </Typography>
            </Logo>

            <Typography
              component="h1"
              variant="h4"
              sx={{
                width: '100%',
                fontSize: 'clamp(2rem, 10vw, 2.15rem)',
                textAlign: 'center',
                mb: 2,
              }}
            >
              Sign up
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleRegistrationSubmit}
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
          </AnimatedCardContent>
        </AnimatePresence>
      </StyledCard>
    </SignUpContainer>
  );
};
