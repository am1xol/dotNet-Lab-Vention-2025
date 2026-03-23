import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { features } from '../../../data/landing-page-data';
import { FeatureCard } from './FeatureCard';
import { translations } from '../../../i18n/translations';

export const FeaturesSection: React.FC = () => {
  return (
    <Box sx={{ py: 12 }}>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: '#7E57C2',
              textAlign: 'center',
              mb: 2,
            }}
          >
            {translations.landing.features}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 10,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {translations.landing.heroSubtitle}
          </Typography>
        </motion.div>

        <Grid container spacing={4} marginTop={5}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 3 }} key={feature.title}>
              <FeatureCard {...feature} delay={index * 0.1} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
