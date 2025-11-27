import React, { useState } from 'react';
import {
  Box,
  Button,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  Card,
  Alert,
  CircularProgress,
  Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Email, ArrowBack, MarkEmailRead } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authService } from '../services/auth-service';

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

const AnimatedCardContent = styled(motion.div)({
  width: '100%',
});

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
  onShowResetForm: (email: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToSignIn,
  onShowResetForm,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError(false);
    setEmailErrorMessage('');
    setError('');
  };

  const validateEmail = (): boolean => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => onShowResetForm(email), 2000);
      } else {
        setError(result.error || 'Failed to send reset code');
      }
    } catch (err: any) {
      setError(err.response?.data?.title || 'Failed to send reset code');
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
                <MarkEmailRead sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
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
                  Check Your Email
                </Typography>
                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    borderRadius: 3,
                    background: 'rgba(76, 175, 80, 0.05)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                  }}
                >
                  We sent a password reset code to <strong>{email}</strong>.
                  Please check your email and enter the code on the next screen.
                </Alert>

                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    mb: 3,
                    fontSize: '0.9rem',
                  }}
                >
                  Redirecting to reset form...
                </Typography>
              </Box>
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
            key="forgot-password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={onBackToSignIn}
                sx={{
                  color: '#7E57C2',
                  minWidth: 'auto',
                  mr: 2,
                  padding: '6px 8px',
                  fontSize: '0.8rem',
                  '& .MuiButton-startIcon': {
                    marginRight: '-3px',
                    '& > *:first-of-type': {
                      fontSize: '18px',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(126, 87, 194, 0.08)',
                    transform: 'translateX(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
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
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Reset Password
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: 4,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Enter your email address and we'll send you a code to reset your
              password.
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  background: 'rgba(244, 67, 54, 0.05)',
                  border: '1px solid rgba(244, 67, 54, 0.2)',
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
                  value={email}
                  onChange={handleEmailChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <Email sx={{ color: '#7E57C2', mr: 1 }} />,
                  }}
                />
              </FormControl>

              <GradientButton
                type="submit"
                fullWidth
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Code'}
              </GradientButton>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                component="button"
                type="button"
                onClick={onBackToSignIn}
                variant="body2"
                sx={{
                  color: '#7E57C2',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Back to Sign In
              </Link>
            </Box>
          </AnimatedCardContent>
        </GlassCard>
      </Zoom>
    </AuthContainer>
  );
};
