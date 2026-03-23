import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { Save } from '@mui/icons-material';
import { UserProfile, UpdateProfileRequest } from '../../types/user';
import { userService } from '../../services/user-service';
import { translations } from '../../i18n/translations';

interface ProfileFormProps {
  user: UserProfile;
  onProfileUpdated: (user: UserProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  }, [user]);

  const validateField = (name: string, value: string) => {
    const trimmedValue = value.trim();

    if (name === 'firstName' || name === 'lastName') {
      if (trimmedValue.length === 0) {
        return translations.profile.fieldCannotBeEmpty;
      }

      if (trimmedValue.length < 2) {
        return translations.profile.minimum2Chars;
      }

      if (/\s\s+/.test(value)) {
        return translations.profile.removeExtraSpaces;
      }

      if (!/^[a-zA-Zа-яА-ЯёЁ]+(?:[ \-][a-zA-Zа-яА-ЯёЁ]+)*$/.test(value)) {
        return translations.profile.useOnlyLetters;
      }
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    const errorMessage = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: errorMessage }));

    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanData: UpdateProfileRequest = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
    };

    const fNameError = validateField('firstName', cleanData.firstName);
    const lNameError = validateField('lastName', cleanData.lastName);

    if (fNameError || lNameError) {
      setFieldErrors({ firstName: fNameError, lastName: lNameError });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updatedUser = await userService.updateProfile(cleanData);
      onProfileUpdated(updatedUser);
      enqueueSnackbar(translations.profile.profileUpdated, { variant: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.title || translations.common.error);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    formData.firstName !== user.firstName ||
    formData.lastName !== user.lastName ||
    formData.email !== user.email;

  const isFormValid = !fieldErrors.firstName && !fieldErrors.lastName;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label={translations.profile.firstName}
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={!!fieldErrors.firstName}
            helperText={fieldErrors.firstName}
            required
          />
          <TextField
            fullWidth
            label={translations.profile.lastName}
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={!!fieldErrors.lastName}
            helperText={fieldErrors.lastName}
            required
          />
        </Box>

        <TextField
          fullWidth
          label={translations.auth.emailAddress}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          helperText={
            user.isEmailVerified
              ? translations.profile.emailVerified
              : translations.profile.emailNotVerified
          }
        />

        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            disabled={!hasChanges || !isFormValid || loading}
            sx={{
              background:
                !hasChanges || !isFormValid
                  ? 'rgba(0, 0, 0, 0.12)'
                  : 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              minWidth: 140,
              borderRadius: 2,
            }}
          >
            {loading ? translations.common.loading : translations.profile.saveChanges}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};
