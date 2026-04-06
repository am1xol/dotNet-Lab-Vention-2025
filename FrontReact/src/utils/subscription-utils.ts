import { UserSubscription } from '../types/subscription';

export function matchesUserSubscriptionCatalog(
  us: UserSubscription,
  subscriptionId: string
): boolean {
  return (
    us.subscription.id === subscriptionId &&
    !!(us.isActive || us.isFrozen || us.cancelledAt)
  );
}

export function canFreezeUserSubscription(
  us: UserSubscription | undefined
): boolean {
  return !!us && us.isActive && !us.cancelledAt && !us.isFrozen;
}

export function canRestoreCancelledUserSubscription(
  us: UserSubscription | undefined
): boolean {
  if (!us?.cancelledAt || us.isFrozen) return false;
  if (!us.validUntil) return false;
  return new Date(us.validUntil) > new Date();
}
