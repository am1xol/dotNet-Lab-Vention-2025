import React from 'react';
import { Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { StatsSection } from './StatsSection';

export const UnauthenticatedHero: React.FC = () => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 2,
            lineHeight: 1.1,
          }}
        >
          Управляйте всеми
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
            color: '#5E35B1',
            mb: 4,
            lineHeight: 1.1,
          }}
        >
          Вашими подписками
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'text.secondary',
            maxWidth: '700px',
            mb: 4,
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          Забудьте о хаосе подписок. Отслеживайте, управляйте и оптимизируйте все
          ваши регулярные платежи из одной красивой и безопасной панели. Экономьте деньги
          и никогда не пропускайте платежи.
        </Typography>
      </motion.div>

      <StatsSection />
    </>
  );
};
