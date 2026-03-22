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
      setError('Failed to load feedback');
      enqueueSnackbar('Failed to load feedback', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      enqueueSnackbar('Please select a rating', { variant: 'warning' });
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
      setSuccessMessage(feedback ? 'Feedback updated successfully!' : 'Thank you for your feedback!');
      enqueueSnackbar(successMessage || 'Feedback submitted successfully!', { variant: 'success' });
    } catch (err: any) {
      setError('Failed to submit feedback');
      enqueueSnackbar('Failed to submit feedback', { variant: 'error' });
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
        Rate your experience with our service and share your feedback
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
            Your Rating
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
              label={rating > 0 ? `${rating}/5` : 'Not rated'} 
              color={rating >= 4 ? 'success' : rating >= 3 ? 'warning' : rating > 0 ? 'error' : 'default'}
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {rating === 5 && 'Excellent! We\'re thrilled you love our service!'}
            {rating === 4 && 'Great! We\'re glad you\'re satisfied.'}
            {rating === 3 && 'Good! We appreciate your feedback.'}
            {rating === 2 && 'Fair. We\'ll try to improve.'}
            {rating === 1 && 'Poor. We\'re sorry to hear that.'}
            {rating === 0 && 'Click on a star to rate your experience'}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
            Your Feedback (Optional)
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Tell us more about your experience..."
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
            Your feedback helps us improve our service
          </Typography>
        </CardContent>
      </Card>

      {feedback && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Last updated: {new Date(feedback.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
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
        {submitting ? 'Submitting...' : feedback ? 'Update Feedback' : 'Submit Feedback'}
      </Button>
    </Box>
  );
};
