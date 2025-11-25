// ProfileForm.tsx - обновленная версия
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
import { UserProfile, UpdateProfileRequest } from '../types/user';
import { userService } from '../services/user-service';

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

    try {
      const updatedUser = await userService.updateProfile(formData);
      onProfileUpdated(updatedUser);
      enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.title || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    formData.firstName !== user.firstName ||
    formData.lastName !== user.lastName ||
    formData.email !== user.email;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            size="medium"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            size="medium"
            variant="outlined"
          />
        </Box>

        <TextField
          fullWidth
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          size="medium"
          variant="outlined"
          helperText={
            user.isEmailVerified
              ? 'Your email address is verified'
              : 'Please verify your email address'
          }
        />

        <Box
          sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            disabled={!hasChanges || loading}
            sx={{
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              minWidth: 140,
              borderRadius: 2,
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};
