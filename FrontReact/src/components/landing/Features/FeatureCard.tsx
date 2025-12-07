import React from 'react';
import { Card, Avatar, Typography } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: SvgIconComponent;
  title: string;
  description: string;
  color: string;
  delay: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  delay,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay }}
      viewport={{ once: true }}
    >
      <Card
        sx={{
          p: 4,
          height: '100%',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: 4,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 20px 60px rgba(126, 87, 194, 0.15)',
          },
        }}
      >
        <Avatar
          sx={{
            bgcolor: color,
            width: 60,
            height: 60,
            mb: 3,
          }}
        >
          <Icon sx={{ fontSize: 30 }} />
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
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      </Card>
    </motion.div>
  );
};