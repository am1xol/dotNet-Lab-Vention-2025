export interface ActiveSubscriptionsByPlan {
  subscriptionId: string;
  subscriptionName: string;
  periodId: string;
  periodName: string;
  finalPrice: number;
  activeSubscriptionsCount: number;
}

export interface SubscriptionWithPlans {
  subscriptionId: string;
  subscriptionName: string;
  category: string;
  basePrice: number;
  periodId: string;
  periodName: string;
  monthsCount: number;
  subscriptionPriceId: string;
  finalPrice: number;
}

export interface TopPopularSubscription {
  subscriptionId: string;
  subscriptionName: string;
  category: string;
  totalSubscriptionsCount: number;
}

export interface SubscriptionsByMonth {
  year: number;
  month: number;
  subscriptionsCount: number;
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

