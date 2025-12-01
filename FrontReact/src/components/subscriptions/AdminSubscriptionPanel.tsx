import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  CloudUpload,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { subscriptionService } from '../../services/subscription-service';
import { fileService } from '../../services/file-service';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '../../types/subscription';

interface AdminSubscriptionPanelProps {
  onSubscriptionCreated: () => void;
  onSubscriptionUpdated: () => void;
  onSubscriptionDeleted: () => void;
}

export const AdminSubscriptionPanel: React.FC<AdminSubscriptionPanelProps> = ({
  onSubscriptionCreated,
  onSubscriptionUpdated,
  onSubscriptionDeleted,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | undefined>(
    undefined
  );
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    name: '',
    description: '',
    price: 0,
    period: 'monthly',
    category: '',
    iconFileId: undefined,
  });

  const periods = ['monthly', 'quarterly', 'yearly', 'lifetime'];
  const categories = [
    'Streaming',
    'Software',
    'Gaming',
    'Productivity',
    'Entertainment',
    'Other',
  ];

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploading(true);

    try {
      const result = await fileService.uploadFile(file);
      setUploadedFileId(result.fileId);
      setFormData((prev) => ({ ...prev, iconFileId: result.fileId }));
    } catch (err: any) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (uploadedFileId) {
      try {
        await fileService.deleteFile(uploadedFileId);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }
    setSelectedFile(null);
    setUploadedFileId(undefined);
    setFormData((prev) => ({ ...prev, iconFileId: undefined }));
  };

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptionsForAdmin();
      const allSubscriptions = Object.values(data).flat();
      setSubscriptions(allSubscriptions);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleCreate = async () => {
    try {
      await subscriptionService.createSubscription(formData);
      setCreateDialogOpen(false);
      resetForm();
      onSubscriptionCreated();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handleUpdate = async () => {
    if (!selectedSubscription) return;

    try {
      const updateData: UpdateSubscriptionRequest = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        period: formData.period,
        category: formData.category,
        iconFileId: formData.iconFileId,
      };

      await subscriptionService.updateSubscription(
        selectedSubscription.id,
        updateData
      );
      setEditDialogOpen(false);
      resetForm();
      onSubscriptionUpdated();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update subscription');
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;

    try {
      await subscriptionService.deleteSubscription(selectedSubscription.id);
      setDeleteDialogOpen(false);
      onSubscriptionDeleted();
      await loadSubscriptions();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete subscription';
      setError(errorMessage);
    }
  };

  const handleToggleActive = async (subscription: Subscription) => {
    try {
      const newActiveStatus = !subscription.isActive;

      if (!newActiveStatus) {
        const confirmMessage = `Deactivating "${subscription.name}" will automatically unsubscribe all users at the end of their billing period. Continue?`;
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      await subscriptionService.toggleSubscriptionActive(
        subscription.id,
        newActiveStatus
      );

      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscription.id
            ? { ...sub, isActive: newActiveStatus }
            : sub
        )
      );

      if (!newActiveStatus) {
        setError(
          `Subscription "${subscription.name}" deactivated. Users will be unsubscribed at the end of their billing periods.`
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update subscription status'
      );
      await loadSubscriptions();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      period: 'monthly',
      category: '',
      iconFileId: undefined,
    });
    setSelectedFile(null);
    setUploadedFileId(undefined);
    setSelectedSubscription(null);
  };

  const openEditDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      name: subscription.name,
      description: subscription.description,
      price: subscription.price,
      period: subscription.period,
      category: subscription.category,
      iconFileId: subscription.iconFileId,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDeleteDialogOpen(true);
  };

  const getFilteredSubscriptions = () => {
    return showOnlyActive
      ? subscriptions.filter((sub) => sub.isActive)
      : subscriptions;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Typography>Loading subscriptions...</Typography>
      </Box>
    );
  }

  const filteredSubscriptions = getFilteredSubscriptions();

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ color: '#7E57C2', fontWeight: 600, mb: 1 }}
          >
            Subscription Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, edit, and manage all subscriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1.5,
          }}
        >
          Create New
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: 'rgba(126, 87, 194, 0.1)',
              border: '1px solid rgba(126, 87, 194, 0.2)',
            }}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Subscriptions
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: '#7E57C2', fontWeight: 600 }}
              >
                {subscriptions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
            }}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: '#4CAF50', fontWeight: 600 }}
              >
                {subscriptions.filter((s) => s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.2)',
            }}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Inactive
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: '#f44336', fontWeight: 600 }}
              >
                {subscriptions.filter((s) => !s.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
            }}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Categories
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: '#FF9800', fontWeight: 600 }}
              >
                {new Set(subscriptions.map((s) => s.category)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {filteredSubscriptions.length} of {subscriptions.length}{' '}
          subscriptions
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              color="primary"
            />
          }
          label="Show only active"
        />
      </Box>

      {/* Subscriptions Grid */}
      {filteredSubscriptions.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          py={8}
          sx={{
            background: 'rgba(0,0,0,0.02)',
            borderRadius: 2,
            border: '1px dashed rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {showOnlyActive
              ? 'No active subscriptions found'
              : 'No subscriptions found'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredSubscriptions.map((subscription, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={subscription.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: subscription.isActive
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(0, 0, 0, 0.04)',
                    backdropFilter: 'blur(10px)',
                    border: subscription.isActive
                      ? '1px solid rgba(255, 255, 255, 0.3)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 3,
                    opacity: subscription.isActive ? 1 : 0.8,
                    position: 'relative',
                  }}
                >
                  {!subscription.isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                      }}
                    >
                      <Chip
                        label="Inactive"
                        color="default"
                        size="small"
                        variant="filled"
                        sx={{
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          color: 'white',
                        }}
                      />
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Box display="flex" alignItems="flex-start" flexGrow={1}>
                        {subscription.iconUrl ? (
                          <Box
                            component="img"
                            src={subscription.iconUrl}
                            sx={{
                              width: 50,
                              height: 50,
                              mr: 2,
                              borderRadius: 2,
                              objectFit: 'cover',
                              filter: subscription.isActive
                                ? 'none'
                                : 'grayscale(100%)',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              mr: 2,
                              borderRadius: 2,
                              bgcolor: subscription.isActive
                                ? 'primary.main'
                                : 'grey.500',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.2rem',
                            }}
                          >
                            {subscription.name.charAt(0)}
                          </Box>
                        )}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{
                              color: subscription.isActive
                                ? 'text.primary'
                                : 'text.secondary',
                            }}
                          >
                            {subscription.name}
                          </Typography>
                          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                            <Chip
                              label={subscription.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={subscription.period}
                              size="small"
                              color="secondary"
                            />
                          </Box>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={subscription.isActive}
                            onChange={() => handleToggleActive(subscription)}
                            color="success"
                          />
                        }
                        label=""
                      />
                    </Box>

                    <Typography
                      color={
                        subscription.isActive ? 'text.secondary' : 'grey.500'
                      }
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {subscription.description}
                    </Typography>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="h5"
                        color={
                          subscription.isActive ? 'primary.main' : 'grey.500'
                        }
                        fontWeight="bold"
                      >
                        {subscription.price} BYN
                      </Typography>
                      <Chip
                        label={subscription.isActive ? 'Active' : 'Inactive'}
                        color={subscription.isActive ? 'success' : 'default'}
                        size="small"
                        icon={
                          subscription.isActive ? (
                            <Visibility />
                          ) : (
                            <VisibilityOff />
                          )
                        }
                      />
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => openEditDialog(subscription)}
                      sx={{
                        color: '#7E57C2',
                        '&:hover': {
                          backgroundColor: 'rgba(126, 87, 194, 0.08)',
                        },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => openDeleteDialog(subscription)}
                      sx={{
                        color: '#f44336',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.08)',
                        },
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Subscription</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                select
                label="Period"
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
              >
                {periods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
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
                    disabled={uploading}
                    fullWidth
                  >
                    {uploading ? 'Uploading...' : 'Upload Icon'}
                  </Button>
                </label>
                {selectedFile && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2">{selectedFile.name}</Typography>
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
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={
              !formData.name || !formData.description || !formData.category
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Subscription</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                select
                label="Period"
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
              >
                {periods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload-edit"
                />
                <label htmlFor="file-upload-edit">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={uploading}
                    fullWidth
                  >
                    {uploading ? 'Uploading...' : 'Upload Icon'}
                  </Button>
                </label>
                {selectedFile && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2">{selectedFile.name}</Typography>
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
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            disabled={
              !formData.name || !formData.description || !formData.category
            }
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete "
            {selectedSubscription?.name}"? This action will remove the
            subscription from the system.
            {selectedSubscription?.isActive && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Note: This subscription is currently active and may have active
                users.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
