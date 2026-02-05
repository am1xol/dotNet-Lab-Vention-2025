import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { Search, FilterList, Clear } from '@mui/icons-material';

interface SubscriptionFiltersProps {
  search: string;
  sortBy: 'name' | 'price' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  priceRange: [number, number];
  periodFilter: string;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: 'name' | 'price' | 'createdAt') => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onPriceRangeChange: (value: [number, number]) => void;
  onPeriodFilterChange: (value: string) => void;
  onResetFilters: () => void;
}

export const SubscriptionFilters: React.FC<SubscriptionFiltersProps> = ({
  search,
  sortBy,
  sortOrder,
  priceRange,
  periodFilter,
  onSearchChange,
  onSortByChange,
  onSortOrderChange,
  onPriceRangeChange,
  onPeriodFilterChange,
  onResetFilters,
}) => {
  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <FilterList /> Фильтры и сортировка
      </Typography>

      <Grid container spacing={3}>
        {/* Поиск */}
        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            fullWidth
            label="Поиск подписок"
            variant="outlined"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Введите название или описание..."
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
        </Grid>

        {/* Сортировка */}
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Сортировать по</InputLabel>
            <Select
              value={sortBy}
              label="Сортировать по"
              onChange={(e) =>
                onSortByChange(e.target.value as 'name' | 'price' | 'createdAt')
              }
            >
              <MenuItem value="name">Названию</MenuItem>
              <MenuItem value="price">Цене</MenuItem>
              <MenuItem value="createdAt">Дате создания</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Порядок</InputLabel>
            <Select
              value={sortOrder}
              label="Порядок"
              onChange={(e) =>
                onSortOrderChange(e.target.value as 'asc' | 'desc')
              }
            >
              <MenuItem value="asc">По возрастанию</MenuItem>
              <MenuItem value="desc">По убыванию</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Фильтр по цене */}
        <Grid size={{ xs: 12, md: 2 }}>
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>
              Диапазон цены: {priceRange[0]} - {priceRange[1]} ₽
            </Typography>
            <Slider
              value={priceRange}
              onChange={(_, newValue) =>
                onPriceRangeChange(newValue as [number, number])
              }
              valueLabelDisplay="auto"
              min={0}
              max={10000}
              step={100}
            />
          </Box>
        </Grid>

        {/* по периоду */}
        <Grid size={{ xs: 12, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Период</InputLabel>
            <Select
              value={periodFilter}
              label="Период"
              onChange={(e) => onPeriodFilterChange(e.target.value)}
            >
              <MenuItem value="all">Все периоды</MenuItem>
              <MenuItem value="monthly">Ежемесячно</MenuItem>
              <MenuItem value="yearly">Ежегодно</MenuItem>
              <MenuItem value="weekly">Еженедельно</MenuItem>
              <MenuItem value="daily">Ежедневно</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Кнопка сброса */}
        <Grid size={{ xs: 12, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<Clear />}
            sx={{ height: '56px' }}
          >
            Сбросить
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
