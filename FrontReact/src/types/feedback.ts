export interface FeedbackDto {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackRequest {
  rating: number;
  comment?: string;
}

export interface FeedbackWithUserDto {
  feedback: FeedbackDto;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}

export interface PagedFeedbackResult {
  items: FeedbackWithUserDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface FeedbackStatisticsDto {
  totalCount: number;
  averageRating: number;
}
