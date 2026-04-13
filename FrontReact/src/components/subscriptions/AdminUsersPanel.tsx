import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Typography,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import { debounce } from 'lodash';
import { User } from '../../types/auth';
import { userService } from '../../services/user-service';
import { Block, CheckCircleOutline, Person, Search } from '@mui/icons-material';
import { translations } from '../../i18n/translations';
import { reportService } from '../../services/report-service';
import { UserSubscriptionReportItem } from '../../types/report';
import { formatDate } from '../../utils/date-utils';

const t = translations.adminUsers;

export const AdminUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserSubscriptions, setSelectedUserSubscriptions] = useState<
    UserSubscriptionReportItem[]
  >([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const updateSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
        setPage(0);
      }, 500),
    []
  );

  useEffect(() => {
    return () => updateSearch.cancel();
  }, [updateSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    updateSearch(value);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers(
        page + 1,
        rowsPerPage,
        debouncedSearch
      );
      setUsers(data.items);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleBlock = async (user: User) => {
    try {
      if (user.isBlocked) {
        await userService.unblockUser(user.id);
      } else {
        await userService.blockUser(user.id);
      }
      loadUsers();
    } catch (error) {
      alert('Не удалось изменить статус пользователя');
    }
  };

  const handleOpenUserDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    setDetailsError('');
    setSelectedUserSubscriptions([]);
    try {
      const data = await reportService.getUserSubscriptions(user.email);
      setSelectedUserSubscriptions(data);
    } catch (error) {
      console.error('Failed to load user subscriptions', error);
      setDetailsError('Не удалось загрузить подписки пользователя');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseUserDetails = () => {
    setSelectedUser(null);
    setSelectedUserSubscriptions([]);
    setDetailsError('');
  };

  useEffect(() => {
    if (!selectedUser) {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [selectedUser]);

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '40px',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#7E57C2' }}>
          {t.title}
        </Typography>
        <TextField
          size="small"
          placeholder={t.searchPlaceholder}
          value={inputValue}
          onChange={handleSearchChange}
          sx={{
            width: 350,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end" sx={{ minWidth: 25 }}>
                {loading && <CircularProgress size={18} color="secondary" />}
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid rgba(0,0,0,0.08)',
          minHeight: '400px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                {t.user}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                {t.idEmail}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                {t.role}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                {t.status}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
                align="right"
              >
                {t.actions}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                hover
                onClick={() => handleOpenUserDetails(user)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Person sx={{ color: '#7E57C2', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {user.id}
                  </Typography>
                  <Typography variant="body2">{user.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.65rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isBlocked ? t.blocked : t.active}
                    color={user.isBlocked ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {user.role !== 'Admin' && (
                    <Button
                      size="small"
                      variant="contained"
                      color={user.isBlocked ? 'success' : 'error'}
                      startIcon={
                        user.isBlocked ? <CheckCircleOutline /> : <Block />
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBlock(user);
                      }}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      {user.isBlocked ? t.unblock : t.block}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog
        open={Boolean(selectedUser)}
        onClose={handleCloseUserDetails}
        maxWidth="md"
        fullWidth
        disableScrollLock
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#7E57C2' }}>
          Подписки пользователя{' '}
          {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedUser.email}
            </Typography>
          )}

          {detailsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress color="secondary" />
            </Box>
          )}

          {!detailsLoading && detailsError && (
            <Typography color="error">{detailsError}</Typography>
          )}

          {!detailsLoading &&
            !detailsError &&
            selectedUserSubscriptions.length === 0 && (
              <Typography color="text.secondary">
                У пользователя пока нет подписок
              </Typography>
            )}

          {!detailsLoading && !detailsError && selectedUserSubscriptions.length > 0 && (
            <Stack spacing={1.5}>
              {selectedUserSubscriptions.map((item) => (
                <Box
                  key={item.userSubscriptionId}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(126, 87, 194, 0.2)',
                    backgroundColor: 'rgba(126, 87, 194, 0.04)',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.subscriptionName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Категория: {item.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Период: {item.periodName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Стоимость: {item.finalPrice.toFixed(2)} BYN
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Дата начала: {formatDate(item.startDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Следующее списание: {formatDate(item.nextBillingDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Действует до: {formatDate(item.validUntil)}
                  </Typography>
                  <Chip
                    sx={{ mt: 1 }}
                    size="small"
                    label={item.isActive ? 'Активна' : 'Неактивна'}
                    color={item.isActive ? 'success' : 'default'}
                    variant={item.isActive ? 'filled' : 'outlined'}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDetails}>{translations.common.close}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
