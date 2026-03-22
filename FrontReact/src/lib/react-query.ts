import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Increased staleTime to 5 minutes - reduces unnecessary refetches
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes instead of default 5 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests only 2 times instead of 3
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 2;
      },
      // Don't refetch on window focus for better performance
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: false,
    },
  },
});
