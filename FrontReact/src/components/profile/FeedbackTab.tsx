import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Star, Send } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { feedbackService } from '../../services/feedback-service';
import { FeedbackDto, CreateFeedbackRequest } from '../../types/feedback';
import { translations } from '../../i18n/translations';
import { formatDateTime } from '../../utils/date-utils';

export const FeedbackTab: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getMyFeedback();
      setFeedback(data);
      if (data) {
        setRating(data.rating);
        setComment(data.comment || '');
      }
    } catch (err: any) {
      setError(translations.common.error);
      enqueueSnackbar(translations.common.error, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      enqueueSnackbar(translations.profile.pleaseSelectRating, { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');
      
      const request: CreateFeedbackRequest = {
        rating,
        comment: comment.trim() || undefined,
      };

      const updatedFeedback = await feedbackService.createOrUpdateFeedback(request);
      setFeedback(updatedFeedback);
      setSuccessMessage(feedback ? translations.profile.feedbackUpdated : translations.profile.thankYouFeedback);
      enqueueSnackbar(translations.profile.feedbackSubmitted, { variant: 'success' });
    } catch (err: any) {
      setError(translations.common.error);
      enqueueSnackbar(translations.common.error, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
        {translations.profile.rateExperience}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Card 
        variant="outlined"
        sx={{ 
          mb: 3, 
          backgroundColor: 'rgba(126, 87, 194, 0.04)',
          borderColor: 'rgba(126, 87, 194, 0.2)',
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star sx={{ color: '#FFB400' }} />
            {translations.profile.yourRating}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Rating
              value={rating}
              onChange={(_, newValue) => {
                setRating(newValue || 0);
              }}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#FFB400',
                },
                '& .MuiRating-iconHover': {
                  color: '#FFB400',
                },
              }}
            />
            <Chip 
              label={rating > 0 ? `${rating}/5` : translations.profile.notRated} 
              color={rating >= 4 ? 'success' : rating >= 3 ? 'warning' : rating > 0 ? 'error' : 'default'}
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {rating === 5 && translations.profile.ratingExcellent}
            {rating === 4 && translations.profile.ratingGreat}
            {rating === 3 && translations.profile.ratingGood}
            {rating === 2 && translations.profile.ratingFair}
            {rating === 1 && translations.profile.ratingPoor}
            {rating === 0 && translations.profile.clickToRate}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
            {translations.profile.yourFeedbackOptional}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={translations.profile.feedbackPlaceholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#7E57C2',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#7E57C2',
                },
              },
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {translations.profile.feedbackHelpImprove}
          </Typography>
        </CardContent>
      </Card>

      {feedback && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {translations.profile.lastUpdated} {formatDateTime(feedback.updatedAt)}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
        sx={{
          background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6A4C93 0%, #9575CD 100%)',
          },
          px: 4,
          py: 1.5,
        }}
      >
        {submitting ? translations.profile.submitting : feedback ? translations.profile.updateFeedback : translations.profile.submitFeedback}
      </Button>
    </Box>
  );
};
