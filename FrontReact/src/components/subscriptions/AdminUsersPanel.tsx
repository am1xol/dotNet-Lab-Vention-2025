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
} from '@mui/material';
import { debounce } from 'lodash';
import { User } from '../../types/auth';
import { userService } from '../../services/user-service';
import { Block, CheckCircleOutline, Person, Search } from '@mui/icons-material';

export const AdminUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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
          User Management
        </Typography>
        <TextField
          size="small"
          placeholder="Search by ID, Name or Email..."
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
                User
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                ID / Email
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                Role
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, bgcolor: 'rgba(126, 87, 194, 0.05)' }}
                align="right"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
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
                    label={user.isBlocked ? 'Blocked' : 'Active'}
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
                      onClick={() => handleToggleBlock(user)}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
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
    </Box>
  );
};
