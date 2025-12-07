import React from 'react';
import { Box, Avatar, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  delay: number;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  title,
  description,
  delay,
}) => {
  return (
    <Grid size = {{ xs:12, md:4}}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: delay }}
        viewport={{ once: true }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(126, 87, 194, 0.1)',
              width: 80,
              height: 80,
              mb: 3,
              mx: 'auto',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#7E57C2',
              border: '2px solid rgba(126, 87, 194, 0.2)',
            }}
          >
            {step}
          </Avatar>
          <Typography
            variant="h5"
            sx={{
              color: '#7E57C2',
              mb: 2,
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
            }}
          >
            {description}
          </Typography>
        </Box>
      </motion.div>
    </Grid>
  );
};