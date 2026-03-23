import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/user-service';
import { translations } from '../../i18n/translations';

export const ChangePasswordForm: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError(translations.auth.passwordsDoNotMatch);
      setLoading(false);
      return;
    }

    try {
      await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      enqueueSnackbar(translations.profile.passwordChanged, { variant: 'success' });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.title || translations.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 4 }}>
      <Typography
        variant="h5"
        sx={{ mb: 3, color: '#7E57C2', fontWeight: 600 }}
      >
        {translations.profile.changePassword}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label={translations.profile.currentPassword}
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            size="medium"
          />

          <TextField
            fullWidth
            label={translations.profile.newPassword}
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            required
            size="medium"
            helperText={translations.profile.passwordHint}
          />

          <TextField
            fullWidth
            label={translations.profile.confirmPassword}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            size="medium"
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                minWidth: 120,
              }}
            >
              {loading ? <CircularProgress size={24} /> : translations.profile.changePassword}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};
