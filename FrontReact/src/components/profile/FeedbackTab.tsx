import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  Divider,
  Stack,
  Avatar,
} from '@mui/material';
import { Star, Send, Forum } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { feedbackService } from '../../services/feedback-service';
import { FeedbackDto, CreateFeedbackRequest, PublicFeedbackSummaryDto } from '../../types/feedback';
import { translations } from '../../i18n/translations';
import { formatDate } from '../../utils/date-utils';

export const FeedbackTab: React.FC = () => {
  const FEEDBACK_COOLDOWN_SECONDS = 60;
  const [feedback, setFeedback] = useState<FeedbackDto | null>(null);
  const [publicSummary, setPublicSummary] = useState<PublicFeedbackSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);

  const { enqueueSnackbar } = useSnackbar();

  const loadPublicSummary = useCallback(async () => {
    try {
      const data = await feedbackService.getPublicSummary(8);
      setPublicSummary(data);
    } catch {
      setPublicSummary(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [myData] = await Promise.all([feedbackService.getMyFeedback(), loadPublicSummary()]);
        setFeedback(myData);
        if (myData) {
          setRating(myData.rating);
          setComment(myData.comment || '');
        }
      } catch (err: unknown) {
        setError(translations.common.error);
        enqueueSnackbar(translations.common.error, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [enqueueSnackbar, loadPublicSummary]);

  useEffect(() => {
    if (!feedback?.updatedAt) {
      setCooldownSecondsLeft(0);
      return;
    }

    const updatedAtMs = Date.parse(feedback.updatedAt);
    if (Number.isNaN(updatedAtMs)) {
      setCooldownSecondsLeft(0);
      return;
    }

    const nextAllowedMs = updatedAtMs + FEEDBACK_COOLDOWN_SECONDS * 1000;
    const secondsLeft = Math.max(0, Math.ceil((nextAllowedMs - Date.now()) / 1000));
    setCooldownSecondsLeft(secondsLeft);
  }, [feedback]);

  useEffect(() => {
    if (cooldownSecondsLeft <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownSecondsLeft]);

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
      await loadPublicSummary();
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: string; headers?: Record<string, string> } };
      if (anyErr?.response?.status === 429) {
        const retryAfterHeader = anyErr?.response?.headers?.['retry-after'];
        const retryAfterSeconds = Number.parseInt(String(retryAfterHeader ?? ''), 10);
        if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
          setCooldownSecondsLeft(retryAfterSeconds);
        }
      }

      const apiMessage =
        anyErr?.response?.status === 429 && typeof anyErr?.response?.data === 'string'
          ? anyErr.response.data
          : null;
      const message = apiMessage || translations.common.error;
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
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

  const avg = publicSummary?.averageRating ?? 0;
  const total = publicSummary?.totalCount ?? 0;
  const recent = publicSummary?.recentReviews ?? [];

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

      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 7 }}>
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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
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
              {translations.profile.lastUpdated} {formatDate(feedback.updatedAt)}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || cooldownSecondsLeft > 0}
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
            {submitting
              ? translations.profile.submitting
              : cooldownSecondsLeft > 0
                ? `${translations.profile.updateFeedback} (${cooldownSecondsLeft}s)`
                : feedback
                  ? translations.profile.updateFeedback
                  : translations.profile.submitFeedback}
          </Button>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            variant="outlined"
            sx={{
              position: { md: 'sticky' },
              top: { md: 16 },
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderColor: 'rgba(126, 87, 194, 0.25)',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Forum sx={{ color: '#7E57C2' }} />
                {translations.profile.communityRatingsTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {translations.profile.communityRatingsSubtitle}
              </Typography>

              {total === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {translations.profile.noServiceRatingsYet}
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h3" fontWeight={700} sx={{ color: '#5E35B1', lineHeight: 1 }}>
                      {avg.toFixed(1)}
                    </Typography>
                    <Rating
                      value={avg}
                      precision={0.1}
                      readOnly
                      size="large"
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: '#FFB400',
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {translations.profile.totalRatingsLabel}: {total}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>
                    {translations.profile.recentReviewsTitle}
                  </Typography>

                  <Stack spacing={2}>
                    {recent.map((rev) => (
                      <Box key={rev.id}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: 'rgba(126, 87, 194, 0.2)',
                              color: '#5E35B1',
                              fontSize: '0.9rem',
                            }}
                          >
                            {(rev.displayName || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                              <Typography variant="body2" fontWeight={600} noWrap title={rev.displayName}>
                                {rev.displayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(rev.updatedAt)}
                              </Typography>
                            </Stack>
                            <Rating
                              value={rev.rating}
                              readOnly
                              size="small"
                              sx={{
                                mt: 0.5,
                                '& .MuiRating-iconFilled': { color: '#FFB400' },
                              }}
                            />
                            {rev.comment ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 0.75,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {rev.comment}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                {translations.profile.noCommentsInReview}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
