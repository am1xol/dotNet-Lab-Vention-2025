import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { LocalOffer } from '@mui/icons-material';
import { userSubscriptionService } from '../../services/user-subscription-service';
import { PromoCodeInfo } from '../../types/payment';
import { formatDate } from '../../utils/date-utils';
import { translations } from '../../i18n/translations';

const PAGE_SIZE = 5;

type PromoCodeStatus = 'active' | 'used' | 'unavailable';

const getPromoStatus = (promo: PromoCodeInfo): PromoCodeStatus => {
  const now = new Date();
  const isExpired = new Date(promo.validTo) < now;
  const isNotStarted = new Date(promo.validFrom) > now;
  const isUsed = promo.userUsageCount >= promo.perUserUsageLimit;

  if (isUsed) {
    return 'used';
  }

  if (isExpired || isNotStarted) {
    return 'unavailable';
  }

  return 'active';
};

const getStatusLabel = (status: PromoCodeStatus): string => {
  if (status === 'active') {
    return translations.userProfile.promoStatusActive;
  }

  if (status === 'used') {
    return translations.userProfile.promoStatusUsed;
  }

  return translations.userProfile.promoStatusUnavailable;
};

const getStatusColor = (
  status: PromoCodeStatus
): 'success' | 'warning' | 'default' => {
  if (status === 'active') {
    return 'success';
  }

  if (status === 'used') {
    return 'warning';
  }

  return 'default';
};

const getUsageText = (promo: PromoCodeInfo): string => {
  return `${promo.userUsageCount}/${promo.perUserUsageLimit}`;
};

export const PromoCodesTab: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userSubscriptionService.getMyPromoCodes();
      setPromoCodes(data);
      setPage(1);
    } catch (err) {
      console.error('Failed to load promo codes', err);
      setError(translations.userProfile.failedToLoadPromoCodes);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(promoCodes.length / PAGE_SIZE));

  const currentPageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return promoCodes.slice(start, start + PAGE_SIZE);
  }, [promoCodes, page]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#7E57C2' }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (promoCodes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <LocalOffer sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6">
          {translations.userProfile.noPromoCodes}
        </Typography>
        <Typography variant="body2">
          {translations.userProfile.noPromoCodesDescription}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" color="#7E57C2" fontWeight="600">
          {translations.userProfile.myPromoCodes} ({promoCodes.length})
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {currentPageItems.map((promo) => {
          const status = getPromoStatus(promo);
          return (
            <Card
              key={promo.id}
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor:
                  status === 'active'
                    ? 'rgba(76, 175, 80, 0.4)'
                    : 'rgba(0, 0, 0, 0.12)',
                opacity: status === 'active' ? 1 : 0.75,
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1}
                  mb={1}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {promo.code}
                  </Typography>
                  <Chip
                    label={getStatusLabel(status)}
                    color={getStatusColor(status)}
                    size="small"
                  />
                </Stack>

                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  {promo.title}
                </Typography>

                {promo.description && (
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    {promo.description}
                  </Typography>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Typography variant="body2">
                    {translations.userProfile.promoValidity}:{' '}
                    {formatDate(promo.validFrom)} - {formatDate(promo.validTo)}
                  </Typography>
                  <Typography variant="body2">
                    {translations.userProfile.promoUsage}: {getUsageText(promo)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
