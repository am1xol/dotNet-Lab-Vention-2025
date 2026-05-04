import { memo, useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Stack,
} from '@mui/material';
import { Schedule, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { UpcomingPayment } from '../../types/payment';
import { formatDate } from '../../utils/date-utils';
import { translations } from '../../i18n/translations';
import { BynAmount } from '../shared/BynAmount';

const PAYMENTS_LIST_PAGE_SIZE = 5;
const PAYMENTS_LIST_AREA_MIN_HEIGHT = 380;

export const UpcomingPaymentsCard = memo(function UpcomingPaymentsCard({
  upcomingPayments,
}: {
  upcomingPayments: UpcomingPayment[];
}) {
  const upcomingTotalPages = Math.max(
    1,
    Math.ceil(upcomingPayments.length / PAYMENTS_LIST_PAGE_SIZE)
  );

  const [upcomingPage, setUpcomingPage] = useState(0);

  useEffect(() => {
    setUpcomingPage((p) => Math.min(p, upcomingTotalPages - 1));
  }, [upcomingPayments.length, upcomingTotalPages]);

  const upcomingPageItems = useMemo(
    () =>
      upcomingPayments.slice(
        upcomingPage * PAYMENTS_LIST_PAGE_SIZE,
        upcomingPage * PAYMENTS_LIST_PAGE_SIZE + PAYMENTS_LIST_PAGE_SIZE
      ),
    [upcomingPayments, upcomingPage]
  );

  const UpcomingRow = ({
    upcoming,
    index,
    showDivider,
  }: {
    upcoming: UpcomingPayment;
    index: number;
    showDivider: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <ListItem sx={{ px: 0 }}>
        <ListItemText
          primary={
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="600" component="div">
                  {upcoming.subscriptionName}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="div"
                  >
                    {translations.statistics.dueDate}{' '}
                    {formatDate(upcoming.nextBillingDate)}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="body1"
                fontWeight="700"
                color="warning.main"
                component="div"
              >
                <BynAmount amount={upcoming.amount} />
              </Typography>
            </Box>
          }
        />
      </ListItem>
      {showDivider && <Divider sx={{ my: 1 }} />}
    </motion.div>
  );

  const UpcomingRowPlaceholder = ({ showDivider }: { showDivider: boolean }) => (
    <>
      <ListItem
        sx={{ px: 0, visibility: 'hidden', pointerEvents: 'none' }}
        aria-hidden
      >
        <ListItemText
          primary={
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="600" component="div">
                  &nbsp;
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" component="div">
                    &nbsp;
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" fontWeight="700" component="div">
                &nbsp;
              </Typography>
            </Box>
          }
        />
      </ListItem>
      {showDivider && <Divider sx={{ my: 1, opacity: 0, borderColor: 'transparent' }} />}
    </>
  );

  const renderUpcomingListBody = () => {
    if (upcomingPayments.length === 0) {
      return (
        <ListItem>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {translations.statistics.noUpcomingPayments}
              </Typography>
            }
            secondary={
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="center"
              >
                {translations.statistics.upcomingBillsWillAppearHere}
              </Typography>
            }
          />
        </ListItem>
      );
    }

    if (upcomingTotalPages > 1) {
      return Array.from({ length: PAYMENTS_LIST_PAGE_SIZE }).map((_, slotIndex) => {
        const item = upcomingPageItems[slotIndex];
        const showDivider = slotIndex < PAYMENTS_LIST_PAGE_SIZE - 1;
        if (item) {
          return (
            <UpcomingRow
              key={`${item.subscriptionId}-${upcomingPage}-${slotIndex}`}
              upcoming={item}
              index={slotIndex}
              showDivider={showDivider}
            />
          );
        }
        return (
          <UpcomingRowPlaceholder
            key={`pad-${upcomingPage}-${slotIndex}`}
            showDivider={showDivider}
          />
        );
      });
    }

    return upcomingPageItems.map((upcoming, index) => (
      <UpcomingRow
        key={upcoming.subscriptionId}
        upcoming={upcoming}
        index={index}
        showDivider={index < upcomingPageItems.length - 1}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      style={{ flex: 1, display: 'flex', minWidth: 0 }}
    >
      <Card
        sx={{
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent
          sx={{
            p: 3,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Schedule
              sx={{
                fontSize: 28,
                color: '#FF9800',
                mr: 2,
              }}
            />
            <Typography variant="h6" fontWeight="700" color="#FF9800">
              {translations.statistics.upcomingPaymentsTitle}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: PAYMENTS_LIST_AREA_MIN_HEIGHT,
              overflow: 'hidden',
            }}
          >
            <List sx={{ pt: 0, pb: 0, flex: 1, overflow: 'hidden' }}>
              {renderUpcomingListBody()}
            </List>
          </Box>

          {upcomingPayments.length > 0 && upcomingTotalPages > 1 && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={0.5}
              sx={{
                mt: 2,
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <IconButton
                size="small"
                aria-label="previous page"
                onClick={() => setUpcomingPage((p) => Math.max(0, p - 1))}
                disabled={upcomingPage === 0}
              >
                <ChevronLeft />
              </IconButton>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 56, textAlign: 'center', userSelect: 'none' }}
              >
                {translations.statistics.upcomingPaymentsPager
                  .replace('{current}', String(upcomingPage + 1))
                  .replace('{total}', String(upcomingTotalPages))}
              </Typography>
              <IconButton
                size="small"
                aria-label="next page"
                onClick={() =>
                  setUpcomingPage((p) =>
                    Math.min(upcomingTotalPages - 1, p + 1)
                  )
                }
                disabled={upcomingPage >= upcomingTotalPages - 1}
              >
                <ChevronRight />
              </IconButton>
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
