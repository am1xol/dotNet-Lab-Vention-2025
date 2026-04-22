export interface UserActivityByPeriod {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  successfulPaymentsCount: number;
  totalSpent: number;
  subscriptionsStartedCount: number;
  subscriptionsCancelledCount: number;
  lastActivityAt?: string;
}

export interface SubscriptionsByPeriod {
  subscriptionId: string;
  subscriptionName: string;
  periodId: string;
  periodName: string;
  newSubscriptionsCount: number;
  activeSubscribersCount: number;
  successfulPaymentsCount: number;
  revenue: number;
}

export interface UserSubscriptionReportItem {
  userSubscriptionId: string;
  userId: string;
  subscriptionId: string;
  subscriptionName: string;
  category: string;
  periodName: string;
  finalPrice: number;
  startDate: string;
  nextBillingDate: string;
  cancelledAt?: string;
  validUntil?: string;
  isActive: boolean;
}

export interface CategoryDistributionItem {
  category: string;
  subscriptionsCount: number;
}

export interface AdminAnalyticsDashboard {
  activeUsersCount: number;
  categoryDistribution: CategoryDistributionItem[];
  newSubscriptionsCount: number;
  cancelledSubscriptionsCount: number;
  paidSubscriptionsCount: number;
  expiringSubscriptionsCount: number;
  successfulPaymentsCount: number;
  failedPaymentsCount: number;
}

