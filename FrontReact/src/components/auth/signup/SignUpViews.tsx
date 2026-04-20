import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
  Typography,
} from '@mui/material';
import {
  Email,
  Lock,
  Person,
  VerifiedUser,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { translations } from '../../../i18n/translations';
import { RegisterRequest } from '../../../types/auth';
import {
  AnimatedCardContent,
  GradientButton,
  Logo,
  LogoIcon,
  StyledTextField,
} from '../shared/AuthStyled';

type RegistrationViewProps = {
  error: string;
  formData: RegisterRequest;
  loading: boolean;
  showPassword: boolean;
  isRegistrationFormValid: boolean;
  firstNameError: boolean;
  firstNameErrorMessage: string;
  lastNameError: boolean;
  lastNameErrorMessage: string;
  emailError: boolean;
  emailErrorMessage: string;
  passwordError: boolean;
  passwordErrorMessage: string;
  acceptTermsError: boolean;
  acceptTermsErrorMessage: string;
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onOpenAgreement: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const SignUpRegistrationView: React.FC<RegistrationViewProps> = ({
  error,
  formData,
  loading,
  showPassword,
  isRegistrationFormValid,
  firstNameError,
  firstNameErrorMessage,
  lastNameError,
  lastNameErrorMessage,
  emailError,
  emailErrorMessage,
  passwordError,
  passwordErrorMessage,
  acceptTermsError,
  acceptTermsErrorMessage,
  onFormSubmit,
  onChange,
  onTogglePassword,
  onOpenAgreement,
}) => (
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
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
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
      {translations.auth.signUpTitle}
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
      {translations.auth.signUpSubtitle}
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
      onSubmit={onFormSubmit}
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
          <FormLabel sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            {translations.profile.firstName}
          </FormLabel>
          <StyledTextField
            error={firstNameError}
            helperText={firstNameErrorMessage}
            name="firstName"
            placeholder={translations.profile.firstName}
            autoComplete="given-name"
            value={formData.firstName}
            onChange={onChange}
            required
            InputProps={{
              startAdornment: <Person sx={{ color: '#7E57C2', mr: 1 }} />,
            }}
          />
        </FormControl>
        <FormControl sx={{ flex: 1 }}>
          <FormLabel sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            {translations.profile.lastName}
          </FormLabel>
          <StyledTextField
            error={lastNameError}
            helperText={lastNameErrorMessage}
            name="lastName"
            placeholder={translations.profile.lastName}
            autoComplete="family-name"
            value={formData.lastName}
            onChange={onChange}
            required
          />
        </FormControl>
      </Box>

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
          value={formData.email}
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
          placeholder="••••••"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={formData.password}
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

      <FormControl error={acceptTermsError}>
        <FormControlLabel
          control={
            <Checkbox
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={onChange}
              sx={{
                color: '#7E57C2',
                '&.Mui-checked': {
                  color: '#7E57C2',
                },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {translations.auth.acceptTermsPrefix}{' '}
              <Typography
                component="button"
                type="button"
                onClick={onOpenAgreement}
                sx={{
                  border: 'none',
                  background: 'transparent',
                  color: '#7E57C2',
                  cursor: 'pointer',
                  p: 0,
                  m: 0,
                  font: 'inherit',
                  textDecoration: 'underline',
                }}
              >
                {translations.auth.userAgreement}
              </Typography>
            </Typography>
          }
        />
        {acceptTermsError && (
          <Typography variant="caption" color="error">
            {acceptTermsErrorMessage}
          </Typography>
        )}
      </FormControl>

      <GradientButton
        type="submit"
        fullWidth
        disabled={loading}
        size="large"
        sx={
          isRegistrationFormValid
            ? { color: '#fff', textShadow: '0 0 8px rgba(255, 255, 255, 0.9)' }
            : undefined
        }
      >
        {loading ? <CircularProgress size={24} /> : translations.auth.createAccount}
      </GradientButton>
    </Box>

    <Divider sx={{ my: 3 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
        {translations.auth.alreadyHaveAccount}
      </Typography>
    </Divider>

    <Button
      component={Link}
      to="/auth/signin"
      fullWidth
      variant="outlined"
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
      {translations.common.signIn}
    </Button>
  </AnimatedCardContent>
);

type VerificationViewProps = {
  email: string;
  error: string;
  loading: boolean;
  verificationCode: string;
  verificationCodeError: boolean;
  resendLoading: boolean;
  resendTimer: number;
  isVerificationCodeValid: boolean;
  isVerificationEmailValid: boolean;
  onFormSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChangeCode: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResendCode: () => void;
};

export const SignUpVerificationView: React.FC<VerificationViewProps> = ({
  email,
  error,
  loading,
  verificationCode,
  verificationCodeError,
  resendLoading,
  resendTimer,
  isVerificationCodeValid,
  isVerificationEmailValid,
  onFormSubmit,
  onChangeCode,
  onResendCode,
}) => (
  <AnimatedCardContent
    key="verification"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Logo sx={{ justifyContent: 'center', mb: 3 }}>
      <LogoIcon>SM</LogoIcon>
      <Typography
        variant="h5"
        sx={{
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
      {translations.auth.verifyEmail}
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
      {translations.auth.enterVerificationCode.replace('{email}', email)}
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
          {translations.auth.verificationCode}
        </FormLabel>
        <StyledTextField
          error={verificationCodeError}
          helperText={verificationCodeError ? translations.validation.required : ''}
          placeholder={translations.auth.enterVerificationCode}
          value={verificationCode}
          onChange={onChangeCode}
          required
          fullWidth
          InputProps={{
            startAdornment: <VerifiedUser sx={{ color: '#7E57C2', mr: 1 }} />,
          }}
        />
      </FormControl>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          mt: 1,
          mb: 1,
          p: 1.5,
          backgroundColor: 'rgba(126, 87, 194, 0.03)',
          borderRadius: 2,
          border: '1px solid rgba(126, 87, 194, 0.1)',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          {translations.auth.codeExpired}
        </Typography>
        <Button
          onClick={onResendCode}
          disabled={resendLoading || resendTimer > 0 || !isVerificationEmailValid}
          variant="outlined"
          size="small"
          sx={{
            textTransform: 'none',
            color: '#7E57C2',
            borderColor: '#7E57C2',
            fontSize: '0.875rem',
            fontWeight: 600,
            py: 0.75,
            px: 2,
            borderRadius: 1.5,
            minWidth: '110px',
            '&:hover': {
              backgroundColor: 'rgba(126, 87, 194, 0.08)',
              borderColor: '#5E35B1',
            },
            '&:disabled': {
              color: 'text.disabled',
              borderColor: 'rgba(0, 0, 0, 0.12)',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          {resendTimer > 0
            ? `${resendTimer}s`
            : resendLoading
              ? translations.common.loading
              : translations.auth.resendCode}
        </Button>
      </Stack>

      <GradientButton
        type="submit"
        fullWidth
        disabled={loading}
        size="large"
        sx={{
          mt: 2,
          ...(isVerificationCodeValid
            ? { color: '#fff', textShadow: '0 0 8px rgba(255, 255, 255, 0.9)' }
            : {}),
        }}
      >
        {loading ? <CircularProgress size={24} /> : translations.auth.verifyEmail}
      </GradientButton>
    </Box>

    <Divider sx={{ my: 3 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
        {translations.auth.alreadyHaveAccount}
      </Typography>
    </Divider>

    <Button
      component={Link}
      to="/auth/signin"
      fullWidth
      variant="outlined"
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
      {translations.common.signIn}
    </Button>
  </AnimatedCardContent>
);

export const SignUpSuccessView: React.FC = () => (
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
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
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
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2,
        }}
      >
        {translations.auth.emailVerified}
      </Typography>
      <Alert
        severity="success"
        sx={{
          mb: 3,
          borderRadius: 3,
          background: 'rgba(76, 175, 80, 0.05)',
        }}
      >
        {translations.auth.emailVerifiedSuccess}
      </Alert>
    </Box>

    <Button
      component={Link}
      to="/auth/signin"
      fullWidth
      variant="contained"
      size="large"
      sx={{
        background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
        borderRadius: 3,
        py: 1.5,
        fontWeight: 600,
        color: 'white',
        '&:hover': {
          backgroundColor: '#5E35B1',
        },
      }}
    >
      {translations.common.signIn}
    </Button>
  </AnimatedCardContent>
);

type AgreementDialogProps = {
  open: boolean;
  loading: boolean;
  html: string;
  onClose: () => void;
};

export const UserAgreementDialog: React.FC<AgreementDialogProps> = ({
  open,
  loading,
  html,
  onClose,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="md"
    scroll="paper"
    slotProps={{
      backdrop: {
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(10, 10, 18, 0.35)',
        },
      },
      paper: {
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
        },
      },
    }}
  >
    <DialogTitle>{translations.auth.userAgreement}</DialogTitle>
    <DialogContent dividers>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            '& h1, & h2, & h3': { color: '#4d2d7a' },
            '& p': { mb: 1.5 },
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>{translations.common.close}</Button>
    </DialogActions>
  </Dialog>
);
