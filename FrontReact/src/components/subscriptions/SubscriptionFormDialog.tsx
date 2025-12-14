import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Typography,
} from '@mui/material';
import { Delete, CloudUpload } from '@mui/icons-material';
import { fileService } from '../../services/file-service';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '../../types/subscription';

type SubscriptionFormData =
  | CreateSubscriptionRequest
  | UpdateSubscriptionRequest;

interface SubscriptionFormDialogProps {
  open: boolean;
  onClose: () => void;
  isEditMode: boolean;
  initialData?: Subscription | null;
  onSave: (data: SubscriptionFormData) => void;
  uploading: boolean;
}

export const SubscriptionFormDialog: React.FC<SubscriptionFormDialogProps> = ({
  open,
  onClose,
  isEditMode,
  initialData,
  onSave,
  uploading,
}) => {
  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    description: '',
    price: 0,
    period: 'monthly',
    category: '',
    iconFileId: undefined,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const periods = ['monthly', 'quarterly', 'yearly', 'lifetime'];
  const categories = [
    'Streaming',
    'Software',
    'Gaming',
    'Productivity',
    'Entertainment',
    'Other',
  ];

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description,
          price: initialData.price,
          period: initialData.period,
          category: initialData.category,
          iconFileId: initialData.iconFileId,
        });
        setSelectedFile(null);
      } else {
        setFormData({
          name: '',
          description: '',
          price: 0,
          period: 'monthly',
          category: '',
          iconFileId: undefined,
        });
        setSelectedFile(null);
      }
      setFileUploadError(null);
    }
  }, [open, isEditMode, initialData]);

  const handleInputChange = (field: keyof SubscriptionFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    setFileUploadError(null);

    try {
      const result = await fileService.uploadFile(file);
      handleInputChange('iconFileId', result.fileId);
    } catch (err: any) {
      setFileUploadError('Failed to upload file');
      handleInputChange('iconFileId', undefined);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (formData.iconFileId) {
      try {
        await fileService.deleteFile(formData.iconFileId);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }
    setSelectedFile(null);
    handleInputChange('iconFileId', undefined);
  };

  const handleSave = () => {
    onSave(formData);
  };

  const isFormValid =
    formData.name &&
    formData.description &&
    formData.category &&
    formData.price >= 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Subscription' : 'Create New Subscription'}
      </DialogTitle>
      <DialogContent>
        {fileUploadError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {fileUploadError}
          </Typography>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                handleInputChange('price', parseFloat(e.target.value) || 0)
              }
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              select
              label="Period"
              value={formData.period}
              onChange={(e) => handleInputChange('period', e.target.value)}
            >
              {periods.map((period) => (
                <MenuItem key={period} value={period}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              fullWidth
              select
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id={`file-upload-${isEditMode ? 'edit' : 'create'}`}
              />
              <label htmlFor={`file-upload-${isEditMode ? 'edit' : 'create'}`}>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={isUploading || uploading}
                  fullWidth
                >
                  {isUploading ? 'Uploading...' : 'Upload Icon'}
                </Button>
              </label>
              {(selectedFile || initialData?.iconUrl) && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography variant="body2">
                    {selectedFile?.name || 'Current Icon'}
                  </Typography>
                  <IconButton size="small" onClick={handleRemoveFile}>
                    <Delete />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isFormValid || isUploading || uploading}
        >
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
