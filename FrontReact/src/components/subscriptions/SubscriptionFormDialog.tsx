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
import { RichTextEditor } from './RichTextEditor';

type SubscriptionFormData = CreateSubscriptionRequest | UpdateSubscriptionRequest;

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
    descriptionMarkdown: '',
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
          descriptionMarkdown: initialData.descriptionMarkdown || '',
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
          descriptionMarkdown: '',
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

    if (!file.type.startsWith('image/')) {
      setFileUploadError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setFileUploadError(null);

    try {
      const result = await fileService.uploadFile(file);
      handleInputChange('iconFileId', result.fileId);
    } catch (err: any) {
      setFileUploadError(err.message || 'Failed to upload file');
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
    const rawContent = formData.descriptionMarkdown || '';
    const cleanContent = rawContent === '<p><br></p>' ? '' : rawContent;
    const plainTextDescription = cleanContent.replace(/<[^>]+>/g, ' ');
    
    const finalDescription = formData.description || 
      (plainTextDescription ? plainTextDescription.substring(0, 100).trim() + (plainTextDescription.length > 100 ? '...' : '') : '');

    const finalData = {
      ...formData,
      description: finalDescription,
      descriptionMarkdown: cleanContent,
    };
    
    onSave(finalData);
  };

  const isFormValid =
    formData.name &&
    formData.category &&
    formData.price >= 0 &&
    (formData.description || (formData.descriptionMarkdown && formData.descriptionMarkdown !== '<p><br></p>'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Subscription' : 'Create New Subscription'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size = {{ xs:12}}>
            <TextField
              fullWidth
              label="Subscription Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </Grid>
          
          <Grid size = {{ xs:12, md:6}}>
            <TextField
              fullWidth
              label="Short Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              helperText="Brief text shown on the card (optional if detailed description is provided)"
            />
          </Grid>
          
          <Grid size = {{ xs:12, md:6}}>
            <Box>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={isUploading || uploading}
                  fullWidth
                  sx={{ height: '56px' }} 
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
                  <Typography variant="body2" noWrap>
                    {selectedFile?.name || 'Current icon'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              )}
              {fileUploadError && (
                <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  {fileUploadError}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid size = {{ xs:12, md:6}}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                handleInputChange('price', parseFloat(e.target.value) || 0)
              }
              inputProps={{ min: 0, step: 0.01 }}
              required
              helperText="BYN"
            />
          </Grid>
          
          <Grid size = {{ xs:12, md:6}}>
            <TextField
              fullWidth
              select
              label="Billing Period"
              value={formData.period}
              onChange={(e) => handleInputChange('period', e.target.value)}
              required
            >
              {periods.map((period) => (
                <MenuItem key={period} value={period}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid size = {{ xs:12}}>
            <TextField
              fullWidth
              select
              label="Category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              <MenuItem value="">
                <em>Select category</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size = {{ xs:12}}>
            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
              Detailed Description
            </Typography>
            <RichTextEditor
              value={formData.descriptionMarkdown || ''}
              onChange={(value) => handleInputChange('descriptionMarkdown', value)}
              label="Features & Details"
              placeholder="Describe what's included in this subscription..."
            />
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