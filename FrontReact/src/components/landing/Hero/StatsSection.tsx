import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { translations } from '../../../i18n/translations';
import { fetchLandingStats } from '../../../services/landing-stats-service';
import { formatLandingStatCount } from '../../../utils/format-landing-stat';

export const StatsSection: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<string | null>(null);
  const [users, setUsers] = useState<string | null>(null);
  const [satisfaction, setSatisfaction] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchLandingStats();
        if (cancelled) return;
        setSubs(formatLandingStatCount(data.subscriptionTypesCount));
        setUsers(formatLandingStatCount(data.activeUsersCount));
        setSatisfaction(
          data.satisfactionPercent != null
            ? `${data.satisfactionPercent}%`
            : translations.common.noData
        );
      } catch (e) {
        console.error('Landing stats failed:', e);
        if (!cancelled) {
          setSubs('—');
          setUsers('—');
          setSatisfaction('—');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { value: subs, label: translations.landing.statsSubscriptions },
    { value: users, label: translations.landing.statsUsers },
    { value: satisfaction, label: translations.landing.statsSatisfaction },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      style={{ width: '100%' }}
    >
      <Grid
        container
        spacing={4}
        sx={{ mt: 8, maxWidth: '800px', margin: '0 auto' }}
      >
        {items.map((stat, index) => (
          <Grid size={{ xs: 6, md: 4 }} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: '#7E57C2',
                    mb: 1,
                    minHeight: { xs: 42, sm: 48 },
                  }}
                >
                  {loading ? (
                    <Skeleton
                      variant="rounded"
                      sx={{
                        mx: 'auto',
                        maxWidth: 120,
                        height: { xs: 42, sm: 48 },
                      }}
                    />
                  ) : (
                    stat.value
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};
