import React, { useState } from 'react';
import {
  Box,
  Button,
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
import { ArrowBack, Lock, VpnKey, VerifiedUser } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authService } from '../../services/auth-service';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { enqueueSnackbar } from 'notistack';

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

export const ResetPasswordForm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email: string })?.email || '';

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

  React.useEffect(() => {
    if (!email && !success) {
      navigate('/auth/forgot-password');
    }
  }, [email, success, navigate]);

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
      await authService.resetPassword({
        email,
        resetToken,
        newPassword: newPassword,
      });

      setSuccess(true);
      enqueueSnackbar('Password reset successfully!', { variant: 'success' });

      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.title ||
        err.response?.data?.error ||
        'Failed to reset password';
      setError(errorMessage);
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
                  Password Reset!
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
                  Your password has been reset successfully. You can now sign in
                  with your new password.
                </Alert>
              </Box>

              <Button
                component={Link}
                to="/auth/signin"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  background:
                    'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                  borderRadius: 3,
                  py: 1.5,
                  fontWeight: 600,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#5E35B1',
                  },
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
            key="reset-password"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Button
                component={Link}
                to="/auth/forgot-password"
                sx={{
                  color: '#7E57C2',
                  mr: 2,
                  padding: '8px',
                  borderRadius: '50%',
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  '&:hover': {
                    backgroundColor: 'rgba(126, 87, 194, 0.1)',
                    transform: 'translateX(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ArrowBack sx={{ fontSize: '20px' }} />
              </Button>
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
              Create New Password
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
              Enter the 6-digit code sent to <strong>{email}</strong> and your
              new password.
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
                  Reset Code
                </FormLabel>
                <StyledTextField
                  error={resetTokenError}
                  helperText={resetTokenErrorMessage}
                  placeholder="123456"
                  value={resetToken}
                  onChange={handleResetTokenChange}
                  required
                  fullWidth
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                    inputMode: 'numeric',
                  }}
                  InputProps={{
                    startAdornment: <VpnKey sx={{ color: '#7E57C2', mr: 1 }} />,
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                >
                  New Password
                </FormLabel>
                <StyledTextField
                  error={passwordError}
                  helperText={passwordErrorMessage}
                  placeholder="••••••"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={handlePasswordChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <Lock sx={{ color: '#7E57C2', mr: 1 }} />,
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                >
                  Confirm Password
                </FormLabel>
                <StyledTextField
                  error={confirmPasswordError}
                  helperText={
                    confirmPasswordError ? 'Passwords do not match' : ''
                  }
                  placeholder="••••••"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: <Lock sx={{ color: '#7E57C2', mr: 1 }} />,
                  }}
                />
              </FormControl>

              <GradientButton
                type="submit"
                fullWidth
                disabled={loading}
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </GradientButton>
            </Box>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}
            >
              <Link
                to="/auth/forgot-password"
                style={{
                  color: '#7E57C2',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Back
              </Link>
              <Link
                to="/auth/signin"
                style={{
                  color: '#7E57C2',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
            </Box>
          </AnimatedCardContent>
        </GlassCard>
      </Zoom>
    </AuthContainer>
  );
};
