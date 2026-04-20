import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  Fade,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import { AccountCircle, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { translations } from '../../../i18n/translations';
import {
  GradientButton,
  Logo,
  LogoIcon,
  StyledTextField,
} from '../shared/AuthStyled';

type SignInViewProps = {
  error: string;
  loading: boolean;
  email: string;
  password: string;
  emailError: boolean;
  emailErrorMessage: string;
  passwordError: boolean;
  passwordErrorMessage: string;
  showPassword: boolean;
  isSignInFormValid: boolean;
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
};

export const SignInView: React.FC<SignInViewProps> = ({
  error,
  loading,
  email,
  password,
  emailError,
  emailErrorMessage,
  passwordError,
  passwordErrorMessage,
  showPassword,
  isSignInFormValid,
  onFormSubmit,
  onChange,
  onTogglePassword,
}) => (
  <>
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
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {translations.auth.signInTitle}
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
          {translations.auth.signInSubtitle}
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
          onSubmit={onFormSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 3,
          }}
        >
          <FormControl>
            <FormLabel sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              {translations.auth.emailAddress}
            </FormLabel>
            <StyledTextField
              error={emailError}
              helperText={emailErrorMessage}
              type="email"
              name="email"
              placeholder={translations.auth.enterEmail}
              autoComplete="email"
              value={email}
              onChange={onChange}
              required
              fullWidth
              InputProps={{
                startAdornment: <Email sx={{ color: '#7E57C2', mr: 1 }} />,
              }}
            />
          </FormControl>

          <FormControl>
            <FormLabel sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
              {translations.common.password}
            </FormLabel>
            <StyledTextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder={translations.auth.passwordRequired}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={onChange}
              required
              fullWidth
              InputProps={{
                startAdornment: <Lock sx={{ color: '#7E57C2', mr: 1 }} />,
                endAdornment: (
                  <Button
                    size="small"
                    onClick={onTogglePassword}
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
              label={translations.common.rememberMe}
            />
            <MuiLink
              component={Link}
              to="/auth/forgot-password"
              variant="body2"
              sx={{
                color: '#7E57C2',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {translations.common.forgotPassword}
            </MuiLink>
          </Box>

          <GradientButton
            type="submit"
            fullWidth
            disabled={loading}
            size="large"
            sx={
              isSignInFormValid
                ? { color: '#fff', textShadow: '0 0 8px rgba(255, 255, 255, 0.9)' }
                : undefined
            }
          >
            {loading ? <CircularProgress size={24} /> : translations.common.signIn}
          </GradientButton>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
            {translations.auth.dontHaveAccount}
          </Typography>
        </Divider>

        <Button
          component={Link}
          to="/auth/signup"
          fullWidth
          variant="outlined"
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
            },
          }}
        >
          {translations.auth.createAccount}
        </Button>
      </Box>
    </Fade>
  </>
);
