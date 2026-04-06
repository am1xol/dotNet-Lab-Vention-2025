export interface PaymentInfo {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholderName: string;
}

export interface SubscribeWithPaymentRequest {
  subscriptionId: string;
  paymentInfo: PaymentInfo;
}

export interface PaymentInitiationResult {
  redirectUrl: string;
  token: string;
}

export interface PromoCodeValidationResult {
  promoCodeId: string;
  promoCode: string;
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface PromoCodeInfo {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: number;
  discountValue: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  totalUsageLimit?: number;
  perUserUsageLimit: number;
  userUsageCount: number;
}

export interface Payment {
  id: string;
  userSubscriptionId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  cardLastFour: string;
  cardBrand: string;
  subscription: {
    id: string;
    name: string;
    price: number;
  };
  periodName?: string;
}

export interface UserStatistics {
  totalSpent: number;
  activeSubscriptionsCount: number;
  totalSubscriptionsCount: number;
  nextBillingDate?: string;
  recentPayments: Payment[];
  upcomingPayments: UpcomingPayment[];
}

export interface UpcomingPayment {
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  nextBillingDate: string;
}
