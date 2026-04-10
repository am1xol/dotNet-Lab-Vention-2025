import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Card,
  IconButton,
  InputAdornment,
  Chip,
  Paper,
  Divider,
  Alert,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';

import { SubscriptionCard } from '../components/subscriptions/SubscriptionCard';
import { UnsubscribeReasonDialog } from '../components/subscriptions/UnsubscribeReasonDialog';
import { PromoCodeDialog } from '../components/subscriptions/PromoCodeDialog';
import { subscriptionService } from '../services/subscription-service';
import { userSubscriptionService } from '../services/user-subscription-service';
import { useAuthStore } from '../store/auth-store';
import { Subscription, UserSubscription } from '../types/subscription';
import { PaymentInitiationResult } from '../types/payment';
import { translations } from '../i18n/translations';
import {
  canFreezeUserSubscription,
  canRestoreCancelledUserSubscription,
  matchesUserSubscriptionCatalog,
} from '../utils/subscription-utils';

declare const BeGateway: new (options: any) => {
  createWidget: () => void;
};

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.light, 0.1)} 0%, transparent 50%),
                 radial-gradient(circle at 40% 40%, ${alpha(theme.palette.info.light, 0.05)} 0%, transparent 50%)`,
    zIndex: 0,
  },
}));

const FloatingCircle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
  animation: 'float 12s ease-in-out infinite',
  zIndex: 0,
  willChange: 'transform',
  filter: 'blur(20px)',
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translate(0px, 0px)',
    },
    '50%': {
      transform: 'translate(10px, -10px)',
    },
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  padding: theme.spacing(2, 0),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3, 0),
  },
}));

type BillingPeriodFilter = 'monthly' | 'quarterly' | 'yearly';

const BILLING_PERIOD_KEYS: BillingPeriodFilter[] = [
  'monthly',
  'quarterly',
  'yearly',
];

const PERIOD_MONTHS_COUNT: Record<BillingPeriodFilter, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

/** Допустимые базовые цены (см. API AllowedPrices) */
const ALLOWED_BASE_PRICES = [10, 20, 50] as const;

function getPricePoints(s: Subscription): number[] {
  if (s.prices?.length) return s.prices.map((p) => p.finalPrice);
  if (s.price != null && !Number.isNaN(Number(s.price))) return [Number(s.price)];
  return [];
}

function getMinPrice(s: Subscription): number {
  const pts = getPricePoints(s);
  return pts.length ? Math.min(...pts) : 0;
}

function subscriptionMatchesPeriods(
  s: Subscription,
  selected: string[]
): boolean {
  if (selected.length === 0) return true;
  if (!s.prices?.length) return false;
  return s.prices.some((p) =>
    selected.some(
      (sel) =>
        PERIOD_MONTHS_COUNT[sel as BillingPeriodFilter] === p.monthsCount
    )
  );
}

function getSubscriptionBasePrice(s: Subscription): number | null {
  const p = Number(s.price);
  if (!Number.isFinite(p)) return null;
  return p;
}

function subscriptionMatchesBasePrices(
  s: Subscription,
  selected: number[]
): boolean {
  if (selected.length === 0) return true;
  const base = getSubscriptionBasePrice(s);
  if (base != null && selected.includes(base)) return true;
  return false;
}

function filterAndSortCatalog(
  items: Subscription[],
  searchQuery: string,
  selectedPeriods: string[],
  selectedBasePrices: number[],
  sortBy: string,
  sortDesc: boolean
): Subscription[] {
  let list = [...items];
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }
  if (selectedPeriods.length > 0) {
    list = list.filter((s) => subscriptionMatchesPeriods(s, selectedPeriods));
  }
  list = list.filter((s) => subscriptionMatchesBasePrices(s, selectedBasePrices));
  list.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'name':
        cmp = a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
        break;
      case 'price':
        cmp = getMinPrice(a) - getMinPrice(b);
        break;
      case 'createdAt':
      default:
        cmp =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDesc ? -cmp : cmp;
  });
  return list;
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: translations.categorySubscriptions.byCreationDate },
  { value: 'name', label: translations.categorySubscriptions.byName },
  { value: 'price', label: translations.categorySubscriptions.byPrice },
];

function periodChipLabel(key: BillingPeriodFilter): string {
  switch (key) {
    case 'monthly':
      return translations.categorySubscriptions.periodMonthly;
    case 'quarterly':
      return translations.categorySubscriptions.periodQuarterly;
    case 'yearly':
      return translations.categorySubscriptions.periodYearly;
    default:
      return key;
  }
}

export const CategorySubscriptionsPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [catalogItems, setCatalogItems] = useState<Subscription[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<UserSubscription[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedBasePrices, setSelectedBasePrices] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDesc, setSortDesc] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribedData, setUnsubscribedData] = useState<{
    [key: string]: { validUntil: string };
  }>({});
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [selectedPriceForPayment, setSelectedPriceForPayment] = useState<{
    priceId: string;
    baseAmount: number;
    periodName?: string;
  } | null>(null);

  const pageSize = 12;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredSorted = useMemo(
    () =>
      filterAndSortCatalog(
        catalogItems,
        searchQuery,
        selectedPeriods,
        selectedBasePrices,
        sortBy,
        sortDesc
      ),
    [catalogItems, searchQuery, selectedPeriods, selectedBasePrices, sortBy, sortDesc]
  );

  const filteredCount = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  const visibleSubscriptions = useMemo(
    () => filteredSorted.slice(0, page * pageSize),
    [filteredSorted, page, pageSize]
  );

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(search);
    }, 500);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  const loadMySubscriptions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await userSubscriptionService.getMySubscriptions();
      const allSubscriptions = Object.values(result).flat();
      setMySubscriptions(allSubscriptions);
    } catch (err) {
      console.error('Failed to load user subscriptions', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!category) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await subscriptionService.getAllSubscriptionsInCategory(
          category
        );
        if (!cancelled) {
          setCatalogItems(items);
          setPage(1);
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions', error);
        if (!cancelled) {
          setError(translations.categorySubscriptions.failedToLoadSubscriptions);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  useEffect(() => {
    if (category && isAuthenticated) {
      void loadMySubscriptions();
    }
  }, [category, isAuthenticated, loadMySubscriptions]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedPeriods, selectedBasePrices, sortBy, sortDesc]);

  const getUserSubscription = (
    subscriptionId: string
  ): UserSubscription | undefined => {
    if (!isAuthenticated || !mySubscriptions) return undefined;
    return mySubscriptions.find((us) =>
      matchesUserSubscriptionCatalog(us, subscriptionId)
    );
  };

  const resolvePriceMeta = (subscriptionPriceId: string) => {
    for (const subscription of catalogItems) {
      const byPriceId = subscription.prices?.find((p) => p.id === subscriptionPriceId);
      if (byPriceId) {
        return { baseAmount: byPriceId.finalPrice, periodName: byPriceId.periodName };
      }
    }

    return { baseAmount: 0, periodName: undefined };
  };

  const executePayment = async (subscriptionId: string, promoCode?: string) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    setActionLoading(subscriptionId);
    setError(null);
    try {
      const result: PaymentInitiationResult =
        await userSubscriptionService.initiatePayment(subscriptionId, promoCode);

      if (typeof BeGateway !== 'undefined' && result.token) {
        const params = {
          checkout_url: 'https://checkout.bepaid.by',
          token: result.token,
          checkout: {
            iframe: true,
            transaction_type: 'payment',
          },
          closeWidget: function (status: string) {
            if (status === 'successful' || status === 'failed') {
              loadMySubscriptions();
            }
          },
        };

        new BeGateway(params).createWidget();
      } else {
        window.open(result.redirectUrl, '_blank');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to initiate payment. Please try again.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleInitiatePayment = async (subscriptionId: string) => {
    const meta = resolvePriceMeta(subscriptionId);
    setSelectedPriceForPayment({
      priceId: subscriptionId,
      baseAmount: meta.baseAmount,
      periodName: meta.periodName,
    });
    setPromoDialogOpen(true);
  };

  const handleSubscribe = async (subscriptionId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    try {
      setActionLoading(subscriptionId);
      await userSubscriptionService.subscribe(subscriptionId);
      await loadMySubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setActionLoading(null);
    }
  };

  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [selectedSubscriptionName, setSelectedSubscriptionName] = useState<string>('');

  const handleUnsubscribe = async (
    subscriptionId: string,
    reason?: string,
    customReason?: string
  ) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    try {
      setActionLoading(subscriptionId);
      const response = await userSubscriptionService.unsubscribe(
        subscriptionId,
        reason,
        customReason
      );
      setUnsubscribedData((prev) => ({
        ...prev,
        [subscriptionId]: { validUntil: response.validUntil },
      }));
      await loadMySubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unsubscribe');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenUnsubscribeDialog = (subscriptionId: string, subscriptionName: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setSelectedSubscriptionName(subscriptionName);
    setUnsubscribeDialogOpen(true);
  };

  const handleCloseUnsubscribeDialog = () => {
    setUnsubscribeDialogOpen(false);
    setSelectedSubscriptionId(null);
    setSelectedSubscriptionName('');
  };

  const handleConfirmUnsubscribe = async (reason: string, customReason?: string) => {
    if (selectedSubscriptionId) {
      await handleUnsubscribe(selectedSubscriptionId, reason, customReason);
      handleCloseUnsubscribeDialog();
    }
  };

  const handleFreeze = async (subscriptionId: string, freezeMonths: number) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }
    try {
      setActionLoading(subscriptionId);
      await userSubscriptionService.freezeSubscription(subscriptionId, freezeMonths);
      await loadMySubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось приостановить подписку');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreCancelled = async (subscriptionId: string) => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }
    try {
      setActionLoading(subscriptionId);
      await userSubscriptionService.restoreCancelledSubscription(subscriptionId);
      await loadMySubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось восстановить подписку');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handlePeriodToggle = (period: string) => {
    setSelectedPeriods((prev) =>
      prev.includes(period)
        ? prev.filter((p) => p !== period)
        : [...prev, period]
    );
  };

  const handleBasePriceToggle = (amount: number) => {
    setSelectedBasePrices((prev) =>
      prev.includes(amount)
        ? prev.filter((x) => x !== amount)
        : [...prev, amount]
    );
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
  };

  const toggleSortOrder = () => {
    setSortDesc((prev) => !prev);
  };

  const resetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setSelectedPeriods([]);
    setSelectedBasePrices([]);
    setSortBy('createdAt');
    setSortDesc(false);
  };

  if (!category) {
    return (
      <PageContainer>
        <ContentContainer>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">{translations.categorySubscriptions.categoryNotFoundMessage}</Typography>
          </Box>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FloatingCircle
        sx={{
          top: '10%',
          left: '5%',
          width: '150px',
          height: '150px',
          animationDelay: '0s',
        }}
      />
      <FloatingCircle
        sx={{
          top: '20%',
          right: '10%',
          width: '200px',
          height: '200px',
          animationDelay: '1.5s',
        }}
      />
      <FloatingCircle
        sx={{
          bottom: '15%',
          left: '15%',
          width: '120px',
          height: '120px',
          animationDelay: '3s',
        }}
      />
      <FloatingCircle
        sx={{
          bottom: '25%',
          right: '20%',
          width: '180px',
          height: '180px',
          animationDelay: '4.5s',
        }}
      />
      <FloatingCircle
        sx={{
          top: '60%',
          left: '25%',
          width: '100px',
          height: '100px',
          animationDelay: '6s',
        }}
      />

      <ContentContainer>
        <Box sx={{ mx: 'auto', px: { xs: 2, md: 3 } }}>
          {/* Header and navigation */}
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ mb: 2 }}
            >
              {translations.categorySubscriptions.backButton}
            </Button>

            <Typography
              variant="h4"
              gutterBottom
              sx={{ textTransform: 'capitalize' }}
            >
              {category}
              <Typography
                component="span"
                variant="h6"
                color="text.secondary"
                sx={{ ml: 2 }}
              >
                ({filteredCount} {translations.categorySubscriptions.subscriptions})
              </Typography>
            </Typography>

            {!isAuthenticated && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {translations.categorySubscriptions.loginToSubscribeAlert}
              </Alert>
            )}
          </Box>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 3,
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Search and filters panel */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems="center"
            >
              <TextField
                placeholder={translations.categorySubscriptions.searchPlaceholder}
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1 }}
                size="small"
              />

              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? 'primary' : 'default'}
              >
                <FilterListIcon />
              </IconButton>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{translations.categorySubscriptions.sortByLabel}</InputLabel>
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  label={translations.categorySubscriptions.sortByLabel}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <IconButton
                onClick={toggleSortOrder}
                color={sortDesc ? 'primary' : 'default'}
              >
                <SortIcon
                  sx={{ transform: sortDesc ? 'rotate(180deg)' : 'none' }}
                />
              </IconButton>

              <Button onClick={resetFilters} variant="outlined" size="small">
                {translations.categorySubscriptions.reset}
              </Button>
            </Stack>

            {/* Advanced filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Divider sx={{ my: 2 }} />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {translations.categorySubscriptions.period}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {BILLING_PERIOD_KEYS.map((period) => (
                        <Chip
                          key={period}
                          label={periodChipLabel(period)}
                          onClick={() => handlePeriodToggle(period)}
                          color={
                            selectedPeriods.includes(period)
                              ? 'primary'
                              : 'default'
                          }
                          variant={
                            selectedPeriods.includes(period)
                              ? 'filled'
                              : 'outlined'
                          }
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {translations.categorySubscriptions.basePriceFilter}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {ALLOWED_BASE_PRICES.map((amount) => (
                        <Chip
                          key={amount}
                          label={`${amount}`}
                          onClick={() => handleBasePriceToggle(amount)}
                          color={
                            selectedBasePrices.includes(amount)
                              ? 'primary'
                              : 'default'
                          }
                          variant={
                            selectedBasePrices.includes(amount)
                              ? 'filled'
                              : 'outlined'
                          }
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </motion.div>
            )}
          </Paper>

          {/* Results */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress />
            </Box>
          ) : filteredSorted.length === 0 ? (
            <Card
              sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: 2 }}
            >
              <Typography variant="h6" color="text.secondary">
                {translations.categorySubscriptions.noSubscriptionsFoundMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {translations.categorySubscriptions.tryChangingParamsMessage}
              </Typography>
            </Card>
          ) : (
            <>
              <Grid container spacing={3}>
                {visibleSubscriptions.map((subscription) => {
                  const userSub = getUserSubscription(subscription.id);
                  const canFreeze = canFreezeUserSubscription(userSub);
                  const canRestore = canRestoreCancelledUserSubscription(userSub);
                  return (
                    <Grid
                      key={subscription.id}
                      size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                      sx={{ display: 'flex' }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', display: 'flex', minWidth: 0 }}
                      >
                        <SubscriptionCard
                          subscription={subscription}
                          prices={subscription.prices}
                          isSubscribed={!!userSub}
                          isCancelled={!!userSub?.cancelledAt && !userSub?.isFrozen}
                          isFrozen={!!userSub?.isFrozen}
                          frozenUntil={userSub?.frozenUntil}
                          canFreezeAndUnsubscribe={canFreeze}
                          canRestoreCancelled={canRestore}
                          validUntil={userSub?.validUntil}
                          unsubscribeInfo={
                            unsubscribedData
                              ? unsubscribedData[subscription.id]
                              : undefined
                          }
                          onSubscribe={handleSubscribe}
                          onInitiatePayment={handleInitiatePayment}
                          onUnsubscribe={(id) =>
                            handleOpenUnsubscribeDialog(id, subscription.name)
                          }
                          onFreeze={handleFreeze}
                          onRestoreCancelled={handleRestoreCancelled}
                          loading={actionLoading === subscription.id}
                        />
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Load more button */}
              {page < totalPages && filteredCount > 0 && (
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={handleLoadMore}
                    sx={{ minWidth: 200, borderRadius: 2 }}
                  >
                    {translations.categorySubscriptions.showMoreButton}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </ContentContainer>

      <UnsubscribeReasonDialog
        open={unsubscribeDialogOpen}
        onClose={handleCloseUnsubscribeDialog}
        onConfirm={handleConfirmUnsubscribe}
        subscriptionName={selectedSubscriptionName}
        loading={actionLoading !== null}
      />
      <PromoCodeDialog
        open={promoDialogOpen}
        subscriptionPriceId={selectedPriceForPayment?.priceId ?? null}
        baseAmount={selectedPriceForPayment?.baseAmount ?? 0}
        periodName={selectedPriceForPayment?.periodName}
        onClose={() => {
          setPromoDialogOpen(false);
          setSelectedPriceForPayment(null);
        }}
        onConfirm={async (promoCode?: string) => {
          if (!selectedPriceForPayment) return;
          await executePayment(selectedPriceForPayment.priceId, promoCode);
        }}
      />
    </PageContainer>
  );
};
