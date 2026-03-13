export interface Period {
  id: string;
  name: string;
  monthsCount: number;
}

export interface SubscriptionPrice {
  id: string;
  subscriptionId: string;
  periodId: string;
  finalPrice: number;
  periodName: string;
  monthsCount: number;
}

export interface Subscription {
  id: string;
  name: string;
  description: string;
  descriptionMarkdown: string;
  price: number;
  category: string;
  iconFileId?: string;
  iconUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  periodName?: string;
  prices?: SubscriptionPrice[];
}

export interface CreateSubscriptionRequest {
  name: string;
  description: string;
  descriptionMarkdown: string;
  price: number;
  category: string;
  iconFileId?: string;
}

export interface UpdateSubscriptionRequest {
  name: string;
  description: string;
  descriptionMarkdown: string;
  price: number;
  category: string;
  iconFileId?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  subscriptionPriceId: string;
  startDate: string;
  nextBillingDate: string;
  cancelledAt?: string;
  validUntil?: string;
  isActive: boolean;
  isValid: boolean;
  status?: string;
  subscription: Subscription;
  periodName: string;
  finalPrice: number;
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

export interface SubscriptionFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  orderBy?: string;
  descending?: boolean;
}

export interface CategoryPageState {
  category: string;
  filters: SubscriptionFilters;
  page: number;
}
