'use client';

import {
  isDefinitiveSessionExpiry,
  SessionRefreshError,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

type QueryProviderProps = {
  children: ReactNode;
};

export function shouldRetryQuery(count: number, error: unknown) {
  return (
    count < 1 &&
    !(error instanceof SessionRefreshError) &&
    !isDefinitiveSessionExpiry(error)
  );
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        staleTime: 60 * 1000,
      },
    },
  });
}

export const appQueryClient = createAppQueryClient();

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={appQueryClient}>
      {children}
    </QueryClientProvider>
  );
}
