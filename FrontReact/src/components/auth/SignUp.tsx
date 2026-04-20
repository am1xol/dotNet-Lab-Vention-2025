import React, { useState } from 'react';
import { Zoom } from '@mui/material';
import { authService } from '../../services/auth-service';
import { RegisterRequest } from '../../types/auth';
import { useSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../../i18n/translations';
import {
  AuthContainer,
  AuthDecorations,
  GlassCard,
} from './shared/AuthStyled';
import {
  SignUpRegistrationView,
  SignUpSuccessView,
  SignUpVerificationView,
  UserAgreementDialog,
} from './signup/SignUpViews';

type SignUpStep = 'registration' | 'verification';
const RESERVED_ADMIN_MARKERS = ['admin', 'админ'];

export const SignUp: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    initialStep?: SignUpStep;
    initialEmail?: string;
  } | null;

  const [step, setStep] = useState<SignUpStep>(
    locationState?.initialStep || 'registration'
  );
  const [formData, setFormData] = useState<RegisterRequest>({
    email: locationState?.initialEmail || '',
    password: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
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
  const [firstNameErrorMessage, setFirstNameErrorMessage] = useState('');
  const [lastNameError, setLastNameError] = useState(false);
  const [lastNameErrorMessage, setLastNameErrorMessage] = useState('');
  const [acceptTermsError, setAcceptTermsError] = useState(false);
  const [acceptTermsErrorMessage, setAcceptTermsErrorMessage] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [agreementHtml, setAgreementHtml] = useState('');
  const [agreementLoading, setAgreementLoading] = useState(false);
  const RESEND_INTERVAL = 60;

  React.useEffect(() => {
    let timerId: number;
    if (resendTimer > 0) {
      timerId = window.setInterval(() => {
        setResendTimer((t) => t - 1);
      }, 1000);
    }
    return () => window.clearInterval(timerId);
  }, [resendTimer]);

  React.useEffect(() => {
    if (!isAgreementOpen || agreementHtml || agreementLoading) {
      return;
    }

    const loadAgreement = async () => {
      setAgreementLoading(true);
      try {
        const response = await fetch('/user-agreement.html');
        if (!response.ok) {
          throw new Error('Failed to load user agreement');
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        setAgreementHtml(doc.body?.innerHTML || html);
      } catch {
        setAgreementHtml(
          `<p style="color:#c62828;">${translations.messages.error}: не удалось загрузить пользовательское соглашение.</p>`
        );
      } finally {
        setAgreementLoading(false);
      }
    };

    loadAgreement();
  }, [isAgreementOpen, agreementHtml, agreementLoading]);

  const getApiErrorMessage = (err: any, fallback: string): string => {
    const responseData = err?.response?.data;

    if (responseData?.title) {
      return responseData.title;
    }

    if (responseData?.error) {
      return responseData.error;
    }

    const validationErrors = responseData?.errors as
      | Record<string, string[]>
      | undefined;
    if (validationErrors) {
      const firstFieldError = Object.values(validationErrors)[0]?.[0];
      if (firstFieldError) {
        return firstFieldError;
      }
    }

    return fallback;
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await authService.resendVerificationCode(formData.email.trim());

      setResendTimer(RESEND_INTERVAL);
      enqueueSnackbar(translations.auth.codeResent, {
        variant: 'info',
      });
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err, translations.messages.error);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      setError(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
    if (e.target.name === 'email') {
      setEmailError(false);
      setEmailErrorMessage('');
    }
    if (e.target.name === 'password') {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }
    if (e.target.name === 'firstName') {
      setFirstNameError(false);
      setFirstNameErrorMessage('');
    }
    if (e.target.name === 'lastName') {
      setLastNameError(false);
      setLastNameErrorMessage('');
    }
    if (e.target.name === 'acceptTerms') {
      setAcceptTermsError(false);
      setAcceptTermsErrorMessage('');
    }
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
  const handleOpenAgreement = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setIsAgreementOpen(true);
  };
  const handleCloseAgreement = () => setIsAgreementOpen(false);

  const hasLeadingOrTrailingSpaces = (value: string): boolean => {
    return value.trim() !== value;
  };
  const containsReservedAdminMarker = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return RESERVED_ADMIN_MARKERS.some((marker) => normalized.includes(marker));
  };
  const getFieldWithReservedAdminMarker = (): keyof RegisterRequest | null => {
    if (containsReservedAdminMarker(formData.firstName)) {
      return 'firstName';
    }
    if (containsReservedAdminMarker(formData.lastName)) {
      return 'lastName';
    }
    if (containsReservedAdminMarker(formData.email)) {
      return 'email';
    }
    return null;
  };
  const hasReservedAdminMarker = getFieldWithReservedAdminMarker() !== null;
  const isRegistrationFormValid =
    /\S+@\S+\.\S+/.test(formData.email.trim()) &&
    formData.password.length >= 6 &&
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    !hasLeadingOrTrailingSpaces(formData.firstName) &&
    !hasLeadingOrTrailingSpaces(formData.lastName) &&
    !hasReservedAdminMarker &&
    formData.acceptTerms;
  const isVerificationCodeValid = verificationCode.trim().length > 0;
  const isVerificationEmailValid = /\S+@\S+\.\S+/.test(formData.email.trim());

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

      if (normalizedField.includes('firstname')) {
        setFirstNameError(true);
        setFirstNameErrorMessage(message);
        hasFieldError = true;
      }

      if (normalizedField.includes('lastname')) {
        setLastNameError(true);
        setLastNameErrorMessage(message);
        hasFieldError = true;
      }
    });

    return hasFieldError;
  };

  const validateRegistrationInputs = (): boolean => {
    let isValid = true;

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError(true);
      setEmailErrorMessage(translations.validation.invalidEmail);
      isValid = false;
    }

    if (!formData.password || formData.password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(translations.validation.passwordMinLength);
      isValid = false;
    }

    if (!formData.firstName || formData.firstName.length < 1) {
      setFirstNameError(true);
      setFirstNameErrorMessage(translations.validation.required);
      isValid = false;
    } else if (hasLeadingOrTrailingSpaces(formData.firstName)) {
      setFirstNameError(true);
      setFirstNameErrorMessage(translations.validation.noLeadingOrTrailingSpaces);
      isValid = false;
    }

    if (!formData.lastName || formData.lastName.length < 1) {
      setLastNameError(true);
      setLastNameErrorMessage(translations.validation.required);
      isValid = false;
    } else if (hasLeadingOrTrailingSpaces(formData.lastName)) {
      setLastNameError(true);
      setLastNameErrorMessage(translations.validation.noLeadingOrTrailingSpaces);
      isValid = false;
    }

    const fieldWithReservedMarker = getFieldWithReservedAdminMarker();
    if (fieldWithReservedMarker === 'firstName') {
      setFirstNameError(true);
      setFirstNameErrorMessage(translations.validation.adminMentionNotAllowed);
      isValid = false;
    } else if (fieldWithReservedMarker === 'lastName') {
      setLastNameError(true);
      setLastNameErrorMessage(translations.validation.adminMentionNotAllowed);
      isValid = false;
    } else if (fieldWithReservedMarker === 'email') {
      setEmailError(true);
      setEmailErrorMessage(translations.validation.adminMentionNotAllowed);
      isValid = false;
    }

    if (!formData.acceptTerms) {
      setAcceptTermsError(true);
      setAcceptTermsErrorMessage(translations.auth.acceptTermsRequired);
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
      await authService.register(formData);

      setResendTimer(RESEND_INTERVAL);
      setStep('verification');
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors as
        | Record<string, string[]>
        | undefined;
      if (serverErrors && applyServerFieldErrors(serverErrors)) {
        return;
      }

      const serverErrorText =
        err.response?.data?.title || err.response?.data?.error || '';
      if (serverErrorText === 'Email already exists') {
        setEmailError(true);
        setEmailErrorMessage(translations.validation.emailAlreadyExists);
        return;
      }

      const errorMessage =
        serverErrorText ||
        translations.auth.accountCreated;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!validateVerificationInputs()) {
      setVerificationCodeError(true);
      return;
    }
    setLoading(true);
    setError('');

    try {
      await authService.verifyEmail(formData.email.trim(), verificationCode.trim());

      enqueueSnackbar(translations.auth.emailVerified, { variant: 'success' });

      setSuccess(true);

      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);
    } catch (err: any) {
      setError(getApiErrorMessage(err, translations.auth.invalidCode));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthContainer direction="column">
        <AuthDecorations includeThirdShape={false} />
        <Zoom in={true} timeout={800}>
          <GlassCard>
            <SignUpSuccessView />
          </GlassCard>
        </Zoom>
      </AuthContainer>
    );
  }

  if (step === 'verification') {
    return (
      <AuthContainer direction="column">
        <AuthDecorations includeThirdShape={false} />
        <Zoom in={true} timeout={800}>
          <GlassCard>
            <SignUpVerificationView
              email={formData.email}
              error={error}
              loading={loading}
              verificationCode={verificationCode}
              verificationCodeError={verificationCodeError}
              resendLoading={resendLoading}
              resendTimer={resendTimer}
              isVerificationCodeValid={isVerificationCodeValid}
              isVerificationEmailValid={isVerificationEmailValid}
              onFormSubmit={handleVerificationSubmit}
              onChangeCode={handleVerificationCodeChange}
              onResendCode={handleResendCode}
            />
          </GlassCard>
        </Zoom>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer direction="column">
      <AuthDecorations />
      <Zoom in={true} timeout={800}>
        <GlassCard>
          <SignUpRegistrationView
            error={error}
            formData={formData}
            loading={loading}
            showPassword={showPassword}
            isRegistrationFormValid={isRegistrationFormValid}
            firstNameError={firstNameError}
            firstNameErrorMessage={firstNameErrorMessage}
            lastNameError={lastNameError}
            lastNameErrorMessage={lastNameErrorMessage}
            emailError={emailError}
            emailErrorMessage={emailErrorMessage}
            passwordError={passwordError}
            passwordErrorMessage={passwordErrorMessage}
            acceptTermsError={acceptTermsError}
            acceptTermsErrorMessage={acceptTermsErrorMessage}
            onFormSubmit={handleRegistrationSubmit}
            onChange={handleChange}
            onTogglePassword={handleClickShowPassword}
            onOpenAgreement={handleOpenAgreement}
          />
        </GlassCard>
      </Zoom>

      <UserAgreementDialog
        open={isAgreementOpen}
        loading={agreementLoading}
        html={agreementHtml}
        onClose={handleCloseAgreement}
      />
    </AuthContainer>
  );
};
