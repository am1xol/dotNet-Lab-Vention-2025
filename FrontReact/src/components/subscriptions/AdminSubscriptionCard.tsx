import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Edit, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Subscription } from '../../types/subscription';

interface AdminSubscriptionCardProps {
  subscription: Subscription;
  index: number;
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
  onToggleActive: (subscription: Subscription) => void;
}

export const AdminSubscriptionCard: React.FC<AdminSubscriptionCardProps> = ({
  subscription,
  index,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: subscription.isActive
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(0, 0, 0, 0.04)',
          backdropFilter: 'blur(10px)',
          border: subscription.isActive
            ? '1px solid rgba(255, 255, 255, 0.3)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
          opacity: subscription.isActive ? 1 : 0.8,
          position: 'relative',
        }}
      >
        {!subscription.isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <Chip
              label="Inactive"
              color="default"
              size="small"
              variant="filled"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                color: 'white',
              }}
            />
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1 }}>
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            mb={2}
          >
            <Box display="flex" alignItems="flex-start" flexGrow={1}>
              {subscription.iconUrl ? (
                <Box
                  component="img"
                  src={subscription.iconUrl}
                  sx={{
                    width: 50,
                    height: 50,
                    mr: 2,
                    borderRadius: 2,
                    objectFit: 'cover',
                    filter: subscription.isActive ? 'none' : 'grayscale(100%)',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    mr: 2,
                    borderRadius: 2,
                    bgcolor: subscription.isActive
                      ? 'primary.main'
                      : 'grey.500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                  }}
                >
                  {subscription.name.charAt(0)}
                </Box>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    color: subscription.isActive
                      ? 'text.primary'
                      : 'text.secondary',
                  }}
                >
                  {subscription.name}
                </Typography>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                  <Chip
                    label={subscription.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={subscription.period}
                    size="small"
                    color="secondary"
                  />
                </Box>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={subscription.isActive}
                  onChange={() => onToggleActive(subscription)}
                  color="success"
                />
              }
              label=""
              sx={{ ml: 1 }}
            />
          </Box>

          <Typography
            color={subscription.isActive ? 'text.secondary' : 'grey.500'}
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subscription.description}
          </Typography>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="h5"
              color={subscription.isActive ? 'primary.main' : 'grey.500'}
              fontWeight="bold"
            >
              {subscription.price} BYN
            </Typography>
            <Chip
              label={subscription.isActive ? 'Active' : 'Inactive'}
              color={subscription.isActive ? 'success' : 'default'}
              size="small"
              icon={subscription.isActive ? <Visibility /> : <VisibilityOff />}
            />
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            size="small"
            startIcon={<Edit />}
            onClick={() => onEdit(subscription)}
            sx={{
              color: '#7E57C2',
              '&:hover': {
                backgroundColor: 'rgba(126, 87, 194, 0.08)',
              },
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            startIcon={<Delete />}
            onClick={() => onDelete(subscription)}
            sx={{
              color: '#f44336',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
              },
            }}
          >
            Delete
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};
