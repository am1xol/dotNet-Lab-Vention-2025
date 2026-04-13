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
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

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
    descriptionMarkdown: '',
    price: 0,
    category: '',
    iconFileId: undefined,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    'Streaming',
    'Software',
    'Gaming',
    'Productivity',
    'Entertainment',
    'Other',
  ];
  const ALLOWED_PRICES = [10, 20, 50];
  const removeLeadingSpaces = (value: string) => value.replace(/^\s+/, '');

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description,
          descriptionMarkdown: initialData.descriptionMarkdown || '',
          price: initialData.price,
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
      setFileUploadError(translations.subscriptions.pleaseSelectImage);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError(translations.subscriptions.fileSizeLimit);
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setFileUploadError(null);

    try {
      const result = await fileService.uploadFile(file);
      handleInputChange('iconFileId', result.fileId);
    } catch (err: any) {
      setFileUploadError(err.message || translations.subscriptions.failedToUpload);
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

    const finalDescription =
      formData.description ||
      (plainTextDescription
        ? plainTextDescription.substring(0, 100).trim() +
          (plainTextDescription.length > 100 ? '...' : '')
        : '');

    const finalData = {
      ...formData,
      name: formData.name.trim(),
      category: formData.category.trim(),
      description: finalDescription,
      descriptionMarkdown: cleanContent,
    };

    onSave(finalData);
    onClose();
  };

  const isFormValid =
    formData.name.trim() &&
    formData.category.trim() &&
    formData.price >= 0 &&
    (formData.description ||
      (formData.descriptionMarkdown &&
        formData.descriptionMarkdown !== '<p><br></p>'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditMode ? translations.subscriptions.editSubscription : translations.subscriptions.createNewSubscription}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={translations.subscriptions.subscriptionName}
              value={formData.name}
              onChange={(e) =>
                handleInputChange('name', removeLeadingSpaces(e.target.value))
              }
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label={translations.subscriptions.shortDescription}
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) =>
                handleInputChange(
                  'description',
                  removeLeadingSpaces(e.target.value)
                )
              }
              helperText={translations.subscriptions.briefDescriptionHint}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
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
                  {isUploading ? translations.subscriptions.uploading : translations.subscriptions.uploadIcon}
                </Button>
              </label>
              {(selectedFile || initialData?.iconUrl) && (
                <Box
                  sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Typography variant="body2" noWrap>
                    {selectedFile?.name || translations.subscriptions.currentIcon}
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
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {fileUploadError}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              select
              label={translations.subscriptions.basePricePerMonth}
              value={formData.price || ''}
              onChange={(e) =>
                handleInputChange('price', parseFloat(e.target.value))
              }
              required
              helperText={translations.subscriptions.selectBaseMonthlyPrice}
            >
              {ALLOWED_PRICES.map((price) => (
                <MenuItem key={price} value={price}>
                  <BynAmount amount={price} minimumFractionDigits={0} maximumFractionDigits={0} />
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              select
              label={translations.subscriptions.category}
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              <MenuItem value="">
                <em>{translations.subscriptions.selectCategory}</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
              {translations.subscriptions.detailedDescription}
            </Typography>
            <RichTextEditor
              value={formData.descriptionMarkdown || ''}
              onChange={(value) =>
                handleInputChange('descriptionMarkdown', value)
              }
              label={translations.subscriptions.featuresAndDetails}
              placeholder={translations.subscriptions.describeIncluded}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          {translations.common.cancel}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isFormValid || isUploading || uploading}
        >
          {isEditMode ? translations.subscriptions.edit : translations.common.create}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
