import React, { useState } from 'react';
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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { subscriptionService } from '../../services/subscription-service';
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptions();
      const allSubscriptions = Object.values(data).flat();
      setSubscriptions(allSubscriptions);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
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
      setError(err.response?.data?.message || 'Failed to delete subscription');
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

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Typography>Loading subscriptions...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ color: '#7E57C2', fontWeight: 600 }}>
          Manage Subscriptions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            py: 1,
          }}
        >
          Create New
        </Button>
      </Box>

      <Grid container spacing={3}>
        {subscriptions.map((subscription, index) => (
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
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="flex-start" mb={2}>
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
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          mr: 2,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
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
                      <Typography variant="h6" fontWeight={600}>
                        {subscription.name}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
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

                  <Typography
                    color="text.secondary"
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
                      color="primary.main"
                      fontWeight="bold"
                    >
                      ${subscription.price}
                    </Typography>
                    <Chip
                      label={subscription.isActive ? 'Active' : 'Inactive'}
                      color={subscription.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    startIcon={<Edit />}
                    onClick={() => openEditDialog(subscription)}
                    sx={{
                      color: '#7E57C2',
                      borderColor: '#7E57C2',
                      '&:hover': {
                        backgroundColor: 'rgba(126, 87, 194, 0.08)',
                      },
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => openDeleteDialog(subscription)}
                    sx={{
                      color: '#f44336',
                      borderColor: '#f44336',
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSubscription?.name}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
