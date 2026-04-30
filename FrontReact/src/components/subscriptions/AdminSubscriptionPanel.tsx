import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { subscriptionService } from '../../services/subscription-service';
import {
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  GroupedSubscriptions,
} from '../../types/subscription';

import { AdminSubscriptionStats } from './AdminSubscriptionStats';
import { SubscriptionFormDialog } from './SubscriptionFormDialog';
import { AdminSubscriptionDeleteDialog } from './AdminSubscriptionDeleteDialog';
import { AdminSubscriptionCard } from './AdminSubscriptionCard';
import { ManagePricesDialog } from './ManagePricesDialog';
import { translations } from '../../i18n/translations';

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
  const [groupedSubscriptions, setGroupedSubscriptions] =
    useState<GroupedSubscriptions>({});
  const [selectedCategory, setSelectedCategory] = useState<string | 'all' | null>(
    null
  );
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [pricesDialogOpen, setPricesDialogOpen] = useState(false);
  const [selectedForPrices, setSelectedForPrices] =
    useState<Subscription | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getSubscriptionsForAdmin();
      setGroupedSubscriptions(data);
      const keys = Object.keys(data).sort((a, b) => a.localeCompare(b, 'ru'));
      setSelectedCategory((prev) => {
        if (prev === 'all') return 'all';
        if (prev != null && keys.includes(prev)) return prev;
        return keys[0] ?? 'all';
      });
    } catch (err) {
      setError(translations.admin.failedToLoadSubscriptions);
      setInfoMessage(null);
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const allSubscriptionsFlat = useMemo(
    () => Object.values(groupedSubscriptions).flat(),
    [groupedSubscriptions]
  );

  const sortedCategoryKeys = useMemo(
    () => Object.keys(groupedSubscriptions).sort((a, b) => a.localeCompare(b, 'ru')),
    [groupedSubscriptions]
  );

  const visibleSubscriptions = useMemo(() => {
    if (selectedCategory === null) {
      return [];
    }
    const base =
      selectedCategory !== 'all'
        ? groupedSubscriptions[selectedCategory] ?? []
        : allSubscriptionsFlat;
    return showOnlyActive ? base.filter((sub) => sub.isActive) : base;
  }, [
    groupedSubscriptions,
    selectedCategory,
    showOnlyActive,
    allSubscriptionsFlat,
  ]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleCreate = async (formData: CreateSubscriptionRequest) => {
    try {
      await subscriptionService.createSubscription(formData);
      setCreateDialogOpen(false);
      setError(null);
      setInfoMessage(null);
      onSubscriptionCreated();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || translations.admin.failedToCreateSubscription);
      setInfoMessage(null);
    }
  };

  const handleManagePrices = (subscription: Subscription) => {
    setSelectedForPrices(subscription);
    setPricesDialogOpen(true);
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
      setInfoMessage(null);
      onSubscriptionUpdated();
      await loadSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || translations.admin.failedToUpdateSubscription);
      setInfoMessage(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;

    try {
      await subscriptionService.deleteSubscription(selectedSubscription.id);
      setDeleteDialogOpen(false);
      setSelectedSubscription(null);
      setError(null);
      setInfoMessage(null);
      onSubscriptionDeleted();
      await loadSubscriptions();
    } catch (err: any) {
      const errorMessage = err.message || translations.admin.failedToDeleteSubscription;
      setError(errorMessage);
      setInfoMessage(null);
    }
  };

  const handleToggleActive = async (subscription: Subscription) => {
    try {
      const newActiveStatus = !subscription.isActive;

      if (!newActiveStatus) {
        const confirmMessage = translations.admin.confirmDeactivate.replace('{name}', subscription.name);
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      await subscriptionService.toggleSubscriptionActive(
        subscription.id,
        newActiveStatus
      );

      setGroupedSubscriptions((prev) => {
        const next: GroupedSubscriptions = {};
        for (const [cat, subs] of Object.entries(prev)) {
          next[cat] = subs.map((sub) =>
            sub.id === subscription.id ? { ...sub, isActive: newActiveStatus } : sub
          );
        }
        return next;
      });

      if (!newActiveStatus) {
        setInfoMessage(
          translations.admin.subscriptionDeactivated.replace('{name}', subscription.name)
        );
        setError(null);
      } else {
        setInfoMessage(null);
        setError(null);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || translations.admin.failedToUpdateStatus
      );
      setInfoMessage(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Typography>{translations.common.loading}</Typography>
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
      {infoMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setInfoMessage(null)}>
          {infoMessage}
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
            {translations.admin.manageSubscriptions}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {translations.admin.subscriptionManagement}
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
          {translations.subscriptions.addSubscription}
        </Button>
      </Box>

      {/* Stats component */}
      <AdminSubscriptionStats subscriptions={allSubscriptionsFlat} />

      {/* Category chips */}
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{ gap: 1, mb: 3 }}
      >
        <Chip
          label={translations.admin.allSubscriptionsChip}
          color={selectedCategory === 'all' ? 'secondary' : 'default'}
          variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
          onClick={() => setSelectedCategory('all')}
          sx={{ fontWeight: selectedCategory === 'all' ? 600 : 400 }}
        />
        {sortedCategoryKeys.map((cat) => {
          const count = groupedSubscriptions[cat]?.length ?? 0;
          const isSelected = selectedCategory === cat;
          return (
            <Chip
              key={cat}
              label={`${cat} (${count})`}
              color={isSelected ? 'secondary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => setSelectedCategory(cat)}
              sx={{ fontWeight: isSelected ? 600 : 400 }}
            />
          );
        })}
      </Stack>

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
          {translations.admin.shownCount.replace('{count}', visibleSubscriptions.length.toString()).replace('{total}', allSubscriptionsFlat.length.toString())}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              color="primary"
            />
          }
          label={translations.admin.showOnlyActive}
        />
      </Box>

      {/* Subscriptions Grid */}
      {visibleSubscriptions.length === 0 ? (
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
              ? translations.admin.noActiveSubscriptions
              : translations.admin.subscriptionsNotFound}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {visibleSubscriptions.map((subscription, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={subscription.id}>
              <AdminSubscriptionCard
                subscription={subscription}
                index={index}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onToggleActive={handleToggleActive}
                onManagePrices={handleManagePrices}
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

      {/* Manage Prices Dialog */}
      <ManagePricesDialog
        open={pricesDialogOpen}
        onClose={() => setPricesDialogOpen(false)}
        subscription={selectedForPrices}
        onSuccess={loadSubscriptions}
      />
    </Box>
  );
};
