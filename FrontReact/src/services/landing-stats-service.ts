import api from './api';
import type { LandingStats } from '../types/landing-stats';

const landingStatsUrl = () =>
  `${import.meta.env.VITE_SUBSCRIPTIONS_API_URL}/api/public/landing-stats`;

export async function fetchLandingStats(): Promise<LandingStats> {
  const { data } = await api.get<LandingStats>(landingStatsUrl());
  return data;
}
