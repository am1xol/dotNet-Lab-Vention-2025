import React, { useState, useEffect } from 'react';
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
import { UserProfile, UpdateProfileRequest } from '../types/user';
import { userService } from '../services/user-service';

interface ProfileFormProps {
  user: UserProfile;
  onProfileUpdated: (user: UserProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onProfileUpdated }) => {
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
    <Card sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, color: '#7E57C2', fontWeight: 600 }}>
        Personal Information
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              size="medium"
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              size="medium"
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
            helperText={user.isEmailVerified ? 'Email verified' : 'Email not verified'}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!hasChanges || loading}
              sx={{
                background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
                minWidth: 120,
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Card>
  );
};