export interface PromoCode {
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
}

export interface PromoAudienceUser {
  userId: string;
  email: string;
  paymentsCount: number;
  totalSpent: number;
  lastPaymentDate?: string;
}

export interface PromoCreateRequest {
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
  audienceType: number;
  daysBack: number;
  topUsersCount: number;
}

export interface PromoCreateResult {
  promoCode: PromoCode;
  assignedUsersCount: number;
  assignedAccounts: PromoAudienceUser[];
}

export interface PromoDeliveryAccount {
  userId: string;
  email: string;
  assignedAt: string;
  isActive: boolean;
  userUsageCount: number;
}

export interface PromoDeliverySummary {
  promoCodeId: string;
  code: string;
  title: string;
  assignedUsersCount: number;
  usedUsersCount: number;
  totalUsagesCount: number;
  accounts: PromoDeliveryAccount[];
}
