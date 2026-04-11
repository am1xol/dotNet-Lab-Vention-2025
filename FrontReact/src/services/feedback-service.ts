import api from './api';
import {
  FeedbackDto,
  CreateFeedbackRequest,
  PagedFeedbackResult,
  FeedbackStatisticsDto,
  PublicFeedbackSummaryDto,
} from '../types/feedback';

export const feedbackService = {
  getMyFeedback: async (): Promise<FeedbackDto | null> => {
    try {
      const response = await api.get<FeedbackDto>('/api/feedback/my');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createOrUpdateFeedback: async (request: CreateFeedbackRequest): Promise<FeedbackDto> => {
    const response = await api.post<FeedbackDto>('/api/feedback', request);
    return response.data;
  },

  getAllFeedbacks: async (pageNumber: number = 1, pageSize: number = 10): Promise<PagedFeedbackResult> => {
    const response = await api.get<PagedFeedbackResult>('/api/feedback', {
      params: { pageNumber, pageSize }
    });
    return response.data;
  },

  getStatistics: async (): Promise<FeedbackStatisticsDto> => {
    const response = await api.get<FeedbackStatisticsDto>('/api/feedback/statistics');
    return response.data;
  },

  getPublicSummary: async (recentCount: number = 8): Promise<PublicFeedbackSummaryDto> => {
    const response = await api.get<PublicFeedbackSummaryDto>('/api/feedback/public-summary', {
      params: { recentCount },
    });
    return response.data;
  },
};

export default feedbackService;
