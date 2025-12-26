export interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  category: string;
  iconFileId?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  name: string;
  description: string;
  price: number;
  period: string;
  category: string;
  iconFileId?: string;
}

export interface UpdateSubscriptionRequest {
  name: string;
  description: string;
  price: number;
  period: string;
  category: string;
  iconFileId?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  subscriptionId: string;
  startDate: string;
  nextBillingDate: string;
  cancelledAt?: string;
  validUntil?: string;
  isActive: boolean;
  isValid: boolean;
  subscription: Subscription;
}

export interface SubscribeRequest {
  subscriptionId: string;
}

export interface SubscribeResponse {
  id: string;
  userId: string;
  subscriptionId: string;
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  message: string;
}

export interface GroupedSubscriptions {
  [category: string]: Subscription[];
}

export interface GroupedUserSubscriptions {
  [category: string]: UserSubscription[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryData {
  items: Subscription[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  isLoadingMore: boolean;
}

export type SubscriptionsByCategory = Record<string, CategoryData>;
