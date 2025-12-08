import React from 'react';
import { Typography, Grid, Card, CardContent } from '@mui/material';
import { Subscription } from '../../types/subscription';

interface AdminSubscriptionStatsProps {
  subscriptions: Subscription[];
}

export const AdminSubscriptionStats: React.FC<AdminSubscriptionStatsProps> = ({
  subscriptions,
}) => {
  const activeCount = subscriptions.filter((s) => s.isActive).length;
  const inactiveCount = subscriptions.length - activeCount;
  const uniqueCategories = new Set(subscriptions.map((s) => s.category)).size;

  const stats = [
    {
      title: 'Total Subscriptions',
      value: subscriptions.length,
      color: '#7E57C2',
      bgColor: 'rgba(126, 87, 194, 0.1)',
      borderColor: 'rgba(126, 87, 194, 0.2)',
    },
    {
      title: 'Active',
      value: activeCount,
      color: '#4CAF50', 
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.2)',
    },
    {
      title: 'Inactive',
      value: inactiveCount,
      color: '#f44336',
      bgColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: 'rgba(244, 67, 54, 0.2)',
    },
    {
      title: 'Categories',
      value: uniqueCategories,
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      borderColor: 'rgba(255, 152, 0, 0.2)',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat) => (
        <Grid size = {{ xs:12, sm:6, md:3}} key={stat.title}>
          <Card
            sx={{
              background: stat.bgColor,
              border: `1px solid ${stat.borderColor}`,
            }}
          >
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                {stat.title}
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: stat.color, fontWeight: 600 }}
              >
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};