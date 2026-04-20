import React, { useState } from 'react';
import { Zoom } from '@mui/material';
import { authService } from '../../services/auth-service';
import { LoginRequest } from '../../types/auth';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { translations } from '../../i18n/translations';
import {
  AuthContainer,
  AuthDecorations,
  GlassCard,
} from './shared/AuthStyled';
import { SignInView } from './signin/SignInView';

export const SignIn: React.FC = () => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const isSignInFormValid =
    /\S+@\S+\.\S+/.test(formData.email.trim()) && formData.password.trim().length > 0;

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

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const applyServerFieldErrors = (errors: Record<string, string[]>) => {
    const entries = Object.entries(errors);
    let hasFieldError = false;

    entries.forEach(([fieldName, messages]) => {
      const message = messages?.[0] || translations.validation.required;
      const normalizedField = fieldName.toLowerCase();

      if (normalizedField.includes('email')) {
        setEmailError(true);
        setEmailErrorMessage(message);
        hasFieldError = true;
      }

      if (normalizedField.includes('password')) {
        setPasswordError(true);
        setPasswordErrorMessage(message);
        hasFieldError = true;
      }
    });

    return hasFieldError;
  };

  const validateInputs = (): boolean => {
    let isValid = true;

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError(true);
      setEmailErrorMessage(translations.validation.invalidEmail);
      isValid = false;
    }

    if (!formData.password || formData.password.length < 1) {
      setPasswordError(true);
      setPasswordErrorMessage(translations.validation.passwordRequired);
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
      await authService.login(formData);

      enqueueSnackbar(translations.messages.signedIn, { variant: 'success' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors as
        | Record<string, string[]>
        | undefined;
      if (serverErrors && applyServerFieldErrors(serverErrors)) {
        return;
      }

      const serverError =
        err.response?.data?.error || err.response?.data?.title;

      if (serverError === 'Please verify your email before logging in') {
        enqueueSnackbar(
          translations.auth.emailNotVerified + '. ' + translations.auth.redirectingToVerification,
          { variant: 'warning' }
        );

        navigate('/auth/signup', {
          state: {
            initialStep: 'verification',
            initialEmail: formData.email,
          },
        });
        return;
      }

      if (serverError === 'Invalid email or password') {
        setEmailError(true);
        setPasswordError(true);
        setPasswordErrorMessage(translations.validation.invalidCredentials);
        return;
      }

      setError(serverError || translations.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer direction="column">
      <AuthDecorations />

      <Zoom in={true} timeout={800}>
        <GlassCard sx={{ maxWidth: '440px' }}>
          <SignInView
            error={error}
            loading={loading}
            email={formData.email}
            password={formData.password}
            emailError={emailError}
            emailErrorMessage={emailErrorMessage}
            passwordError={passwordError}
            passwordErrorMessage={passwordErrorMessage}
            showPassword={showPassword}
            isSignInFormValid={isSignInFormValid}
            onFormSubmit={handleSubmit}
            onChange={handleChange}
            onTogglePassword={handleClickShowPassword}
          />
        </GlassCard>
      </Zoom>
    </AuthContainer>
  );
};
