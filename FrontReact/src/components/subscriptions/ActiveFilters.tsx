import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ActiveFiltersProps {
  search: string;
  selectedPeriods: string[];
  priceRange: [number, number];
  onRemoveFilter: (type: string, value?: string) => void;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  search,
  selectedPeriods,
  priceRange,
  onRemoveFilter,
  onClearAll,
}) => {
  const hasFilters =
    search ||
    selectedPeriods.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000;

  if (!hasFilters) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        <Typography variant="body2" color="text.secondary">
          Активные фильтры:
        </Typography>

        {search && (
          <Chip
            label={`Поиск: "${search}"`}
            onDelete={() => onRemoveFilter('search')}
            deleteIcon={<CloseIcon />}
            size="small"
          />
        )}

        {selectedPeriods.map((period) => (
          <Chip
            key={period}
            label={`Период: ${period}`}
            onDelete={() => onRemoveFilter('period', period)}
            deleteIcon={<CloseIcon />}
            size="small"
          />
        ))}

        {(priceRange[0] > 0 || priceRange[1] < 1000) && (
          <Chip
            label={`Цена: ${priceRange[0]}-${priceRange[1]} руб.`}
            onDelete={() => onRemoveFilter('price')}
            deleteIcon={<CloseIcon />}
            size="small"
          />
        )}

        <Chip
          label="Очистить все"
          onClick={onClearAll}
          variant="outlined"
          size="small"
        />
      </Stack>
    </Box>
  );
};
