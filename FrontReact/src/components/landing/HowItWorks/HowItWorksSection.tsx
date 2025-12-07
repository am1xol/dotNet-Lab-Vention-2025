import React from 'react';
import { Box, Container, Typography, Grid, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { steps } from '../../../data/landing-page-data';
import { StepCard } from './StepCard';
import { useNavigate } from 'react-router-dom';

export const HowItWorksSection: React.FC = () => {
  const navigate = useNavigate();

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
            How It Works
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 8,
            }}
          >
            Get started in just 3 simple steps
          </Typography>
        </motion.div>

        <Grid
          container
          spacing={4}
          sx={{ maxWidth: '900px', margin: '0 auto' }}
        >
          {steps.map((step, index) => (
            <StepCard key={step.step} {...step} delay={index * 0.2} />
          ))}
        </Grid>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginTop: '6rem' }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#7E57C2',
              mb: 4,
            }}
          >
            Ready to Take Control?
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/auth?form=signup')}
            sx={{
              py: 3,
              px: 8,
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
              color: 'white',
              borderRadius: 3,
              fontWeight: 700,
              boxShadow: '0 8px 32px rgba(126, 87, 194, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 16px 48px rgba(126, 87, 194, 0.4)',
                transform: 'translateY(-4px) scale(1.02)',
              },
            }}
          >
            Start Managing Your Subscriptions Now
          </Button>
        </motion.div>
      </Container>
    </Box>
  );
};