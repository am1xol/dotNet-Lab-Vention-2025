import React from 'react';
import { Box } from '@mui/material';

interface BynAmountProps {
  amount: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
}

export const BynAmount: React.FC<BynAmountProps> = ({
  amount,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  locale = 'ru-BY',
}) => {
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.2em',
        lineHeight: 'inherit',
        color: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
      }}
    >
      <span>{formattedAmount}</span>
      <Box
        component="i"
        className="nbrb-icon"
        aria-label="BYN"
        sx={{
          display: 'inline-block',
          color: 'inherit',
          fontSize: '1.15em',
          fontWeight: 700,
          lineHeight: 1,
          transform: 'translateY(0.02em)',
          whiteSpace: 'nowrap',
        }}
      >
        BYN
      </Box>
    </Box>
  );
};
