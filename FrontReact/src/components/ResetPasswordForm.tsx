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

const ResetPasswordContainer = styled(Stack)(({ theme }) => ({
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

interface ResetPasswordFormProps {
  email: string;
  onBackToSignIn: () => void;
  onBackToForgotPassword: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  email,
  onBackToSignIn,
  onBackToForgotPassword,
}) => {
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [resetTokenError, setResetTokenError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const [resetTokenErrorMessage, setResetTokenErrorMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleResetTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetToken(e.target.value.replace(/\D/g, '').slice(0, 6));
    setResetTokenError(false);
    setResetTokenErrorMessage('');
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setPasswordError(false);
    setPasswordErrorMessage('');
    setError('');
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError(false);
    setError('');
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!resetToken || resetToken.length !== 6) {
      setResetTokenError(true);
      setResetTokenErrorMessage(
        'Please enter the 6-digit code from your email.'
      );
      isValid = false;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(true);
      setError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.resetPassword({
        email,
        resetToken,
        newPassword,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.title || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ResetPasswordContainer direction="column">
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
              Password Reset!
            </Typography>

            <Alert
              severity="success"
              sx={{
                mb: 3,
                borderRadius: 3,
              }}
            >
              Your password has been reset successfully. You can now sign in
              with your new password.
            </Alert>

            <Button
              fullWidth
              variant="contained"
              onClick={onBackToSignIn}
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              }}
            >
              Sign In
            </Button>
          </motion.div>
        </StyledCard>
      </ResetPasswordContainer>
    );
  }

  return (
    <ResetPasswordContainer direction="column">
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
          Create New Password
        </Typography>

        <Typography
          variant="body1"
          sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}
        >
          Enter the 6-digit code sent to <strong>{email}</strong> and your new
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
            <FormLabel htmlFor="resetToken">Reset Code</FormLabel>
            <TextField
              error={resetTokenError}
              helperText={resetTokenErrorMessage}
              id="resetToken"
              name="resetToken"
              placeholder="123456"
              value={resetToken}
              onChange={handleResetTokenChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="newPassword">New Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="newPassword"
              placeholder="••••••"
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={handlePasswordChange}
              required
              fullWidth
              variant="outlined"
              size="medium"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
            <TextField
              error={confirmPasswordError}
              helperText={confirmPasswordError ? 'Passwords do not match' : ''}
              name="confirmPassword"
              placeholder="••••••"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
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
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Link
            component="button"
            type="button"
            onClick={onBackToForgotPassword}
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
            Back
          </Link>
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
            Sign In
          </Link>
        </Box>
      </StyledCard>
    </ResetPasswordContainer>
  );
};
