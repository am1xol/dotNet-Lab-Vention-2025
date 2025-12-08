import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Alert, Switch, FormControlLabel, Grid } from '@mui/material';
import { Add } from '@mui/icons-material';
import { subscriptionService } from '../../services/subscription-service';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '../../types/subscription';

import { AdminSubscriptionStats } from './AdminSubscriptionStats';
import { SubscriptionFormDialog } from './SubscriptionFormDialog';
import { AdminSubscriptionDeleteDialog } from './AdminSubscriptionDeleteDialog';
import { AdminSubscriptionCard } from './AdminSubscriptionCard';

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
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const loadSubscriptions = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);


  const handleCreate = async (formData: CreateSubscriptionRequest) => {
    try {
      await subscriptionService.createSubscription(formData);
      setCreateDialogOpen(false);
      setError(null);
      onSubscriptionCreated();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handleUpdate = async (formData: UpdateSubscriptionRequest) => {
    if (!selectedSubscription) return;

    try {
      await subscriptionService.updateSubscription(
        selectedSubscription.id,
        formData
      );
      setEditDialogOpen(false);
      setError(null);
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
      setSelectedSubscription(null);
      setError(null);
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
      } else {
        setError(null);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to update subscription status'
      );
      await loadSubscriptions();
    }
  };


  const openEditDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
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

      {/* Stats component */}
      <AdminSubscriptionStats subscriptions={subscriptions} />

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
            <Grid size = {{ xs:12, md:6, lg:4}} key={subscription.id}>
              <AdminSubscriptionCard
                subscription={subscription}
                index={index}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onToggleActive={handleToggleActive}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <SubscriptionFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        isEditMode={false}
        onSave={handleCreate}
        uploading={false}
      />

      {/* Edit Dialog */}
      <SubscriptionFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        isEditMode={true}
        initialData={selectedSubscription}
        onSave={handleUpdate}
        uploading={false}
      />

      {/* Delete Dialog */}
      <AdminSubscriptionDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        subscription={selectedSubscription}
        onConfirmDelete={handleDelete}
      />
    </Box>
  );
};