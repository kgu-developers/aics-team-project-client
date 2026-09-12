import { useAuthStore } from '~/features/auth/authStore';

const sessions = new WeakMap<object, number>();
let nextSession = 0;
export const midReportKeys = {
  all: ['mid-reports'] as const,
  current: (session: object = useAuthStore.getState()) => {
    if (!sessions.has(session)) sessions.set(session, ++nextSession);
    return [...midReportKeys.all, 'current', sessions.get(session)] as const;
  },
};
