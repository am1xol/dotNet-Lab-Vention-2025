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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { authService } from '../services/auth-service';

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(6),
  gap: theme.spacing(3),
  margin: 'auto',
  maxWidth: '450px',
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

const ForgotPasswordContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(3),
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
  position: 'relative',
}));

const Logo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const LogoIcon = styled(Box)(() => ({
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
      <ForgotPasswordContainer direction="column">
        <StyledCard>
          <Logo>
            <LogoIcon>SM</LogoIcon>
            <Typography variant="h6" sx={{ color: '#7E57C2', fontWeight: 700 }}>
              SubscriptionManager
            </Typography>
          </Logo>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              component="h1"
              variant="h4"
              sx={{
                textAlign: 'center',
                mb: 2,
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Check Your Email
            </Typography>

            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 3,
              }}
            >
              We sent a password reset code to <strong>{email}</strong>. Please
              check your email and enter the code on the next screen.
            </Alert>

            <Typography
              variant="body2"
              sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}
            >
              Redirecting to reset form...
            </Typography>
          </motion.div>
        </StyledCard>
      </ForgotPasswordContainer>
    );
  }

  return (
    <ForgotPasswordContainer direction="column">
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
          Reset Password
        </Typography>

        <Typography
          variant="body1"
          sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}
        >
          Enter your email address and we'll send you a code to reset your
          password.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 3,
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
              value={email}
              onChange={handleEmailChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
            />
          </FormControl>

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
            {loading ? <CircularProgress size={24} /> : 'Send Reset Code'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            type="button"
            onClick={onBackToSignIn}
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
            Back to Sign In
          </Link>
        </Box>
      </StyledCard>
    </ForgotPasswordContainer>
  );
};
