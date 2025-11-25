import React, { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormLabel,
  FormControl,
  TextField,
  Typography,
  Stack,
  Card,
  Alert,
  CircularProgress,
  Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Email,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
  ArrowBack,
  VerifiedUser,
} from '@mui/icons-material';
import { authService } from '../services/auth-service';
import { RegisterRequest, VerifyEmailRequest } from '../types/auth';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';

const GlassCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(5),
  gap: theme.spacing(4),
  margin: 'auto',
  maxWidth: '480px',
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

const AnimatedCardContent = styled(motion.div)({
  width: '100%',
});

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
  const [showPassword, setShowPassword] = useState(false);
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

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const validateRegistrationInputs = (): boolean => {
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
      <AuthContainer direction="column">
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

        <Zoom in={true} timeout={800}>
          <GlassCard>
            <AnimatedCardContent
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Logo>
                <LogoIcon>SM</LogoIcon>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    background:
                      'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  SubscriptionManager
                </Typography>
              </Logo>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <VerifiedUser sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background:
                      'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                  }}
                >
                  Email Verified!
                </Typography>
                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: 'rgba(76, 175, 80, 0.05)',
                  }}
                >
                  Your email has been successfully verified! You can now sign in
                  to your account.
                </Alert>
              </Box>

              <GradientButton fullWidth onClick={onToggleMode} size="large">
                Sign In
              </GradientButton>
            </AnimatedCardContent>
          </GlassCard>
        </Zoom>
      </AuthContainer>
    );
  }

  if (step === 'verification') {
    return (
      <AuthContainer direction="column">
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

        <Zoom in={true} timeout={800}>
          <GlassCard>
            <AnimatedCardContent
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => setStep('registration')}
                  sx={{ color: '#7E57C2', minWidth: 'auto', mr: 2 }}
                />
                <Logo sx={{ flex: 1, justifyContent: 'flex-start' }}>
                  <LogoIcon>SM</LogoIcon>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      background:
                        'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    SubscriptionManager
                  </Typography>
                </Logo>
              </Box>

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
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Verify Email
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
                Enter the verification code sent to {formData.email}
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: 'rgba(244, 67, 54, 0.05)',
                  }}
                >
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
                  gap: 3,
                }}
              >
                <FormControl>
                  <FormLabel
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                  >
                    Verification Code
                  </FormLabel>
                  <StyledTextField
                    error={verificationCodeError}
                    helperText={
                      verificationCodeError
                        ? 'Verification code is required'
                        : ''
                    }
                    placeholder="Enter the 6-digit code"
                    value={verificationCode}
                    onChange={handleVerificationCodeChange}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <VerifiedUser sx={{ color: '#7E57C2', mr: 1 }} />
                      ),
                    }}
                  />
                </FormControl>

                <GradientButton
                  type="submit"
                  fullWidth
                  disabled={loading}
                  size="large"
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify Email'}
                </GradientButton>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', px: 2 }}
                >
                  Already have an account?
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                onClick={onToggleMode}
                size="large"
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
                Sign In
              </Button>
            </AnimatedCardContent>
          </GlassCard>
        </Zoom>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer direction="column">
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
          <AnimatedCardContent
            key="registration"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Logo>
              <LogoIcon>SM</LogoIcon>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background:
                    'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                SubscriptionManager
              </Typography>
            </Logo>

            <Typography
              component="h1"
              variant="h4"
              sx={{
                textAlign: 'center',
                mb: 1,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Create Account
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
              Join us to manage your subscriptions
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  background: 'rgba(244, 67, 54, 0.05)',
                }}
              >
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
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                  >
                    First Name
                  </FormLabel>
                  <StyledTextField
                    error={firstNameError}
                    helperText={firstNameError ? 'First name is required' : ''}
                    name="firstName"
                    placeholder="John"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <Person sx={{ color: '#7E57C2', mr: 1 }} />
                      ),
                    }}
                  />
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                  >
                    Last Name
                  </FormLabel>
                  <StyledTextField
                    error={lastNameError}
                    helperText={lastNameError ? 'Last name is required' : ''}
                    name="lastName"
                    placeholder="Doe"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </FormControl>
              </Box>

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
                    startAdornment: <Email sx={{ color: '#7E57C2', mr: 1 }} />,
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
                  placeholder="••••••"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

              <GradientButton
                type="submit"
                fullWidth
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </GradientButton>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', px: 2 }}
              >
                Already have an account?
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={onToggleMode}
              size="large"
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
              Sign In
            </Button>
          </AnimatedCardContent>
        </GlassCard>
      </Zoom>
    </AuthContainer>
  );
};
